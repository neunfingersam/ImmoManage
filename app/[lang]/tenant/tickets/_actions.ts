'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ticketSchema, type TicketFormValues } from '@/lib/schemas/ticket'
import type { ActionResult } from '@/lib/action-result'
import type { Ticket } from '@/lib/generated/prisma'

export async function getMyTickets() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return []

  return prisma.ticket.findMany({
    where: { tenantId: session.user.id },
    include: {
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, unitNumber: true } },
      comments: { select: { id: true }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getMyTicket(ticketId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  return prisma.ticket.findFirst({
    where: { id: ticketId, tenantId: session.user.id },
    include: {
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, unitNumber: true } },
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export async function createTicket(data: TicketFormValues): Promise<ActionResult<Ticket>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = ticketSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: (parsed.error as any).issues?.[0]?.message ?? parsed.error.message }

  const property = await prisma.property.findFirst({
    where: { id: parsed.data.propertyId, companyId: session.user.companyId },
  })
  if (!property) return { success: false, error: 'Immobilie nicht gefunden' }

  try {
    const ticket = await prisma.ticket.create({
      data: {
        companyId: session.user.companyId,
        propertyId: parsed.data.propertyId,
        tenantId: session.user.id,
        unitId: parsed.data.unitId ?? null,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        status: 'OPEN',
        images: JSON.stringify([]),
      },
    })
    revalidatePath('/tenant/tickets')
    return { success: true, data: ticket }
  } catch (e) {
    return { success: false, error: 'Fehler beim Erstellen der Meldung' }
  }
}
