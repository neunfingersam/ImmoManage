'use server'

import { revalidateAllLocales } from '@/lib/revalidate'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/action-utils'
import { ticketSchema, type TicketFormValues } from '@/lib/schemas/ticket'
import type { ActionResult } from '@/lib/action-result'
import type { Ticket } from '@/lib/generated/prisma'

export async function getOwnerTickets() {
  const session = await getAuthSession()
  if (!session) return []

  return prisma.ticket.findMany({
    where: { tenantId: session.user.id },
    include: {
      property: { select: { name: true } },
      unit: { select: { unitNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getOwnerProperties() {
  const session = await getAuthSession()
  if (!session) return []

  return prisma.propertyOwner.findMany({
    where: { userId: session.user.id },
    include: {
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, unitNumber: true } },
    },
  })
}

export async function createOwnerTicket(data: TicketFormValues): Promise<ActionResult<Ticket>> {
  const session = await getAuthSession()
  if (!session) return { success: false, error: 'Nicht authentifiziert' }

  const parsed = ticketSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

  // Verify the owner has access to this property
  const ownership = await prisma.propertyOwner.findFirst({
    where: { userId: session.user.id, propertyId: parsed.data.propertyId },
  })
  if (!ownership) return { success: false, error: 'Kein Zugriff auf diese Liegenschaft' }

  const ticket = await prisma.ticket.create({
    data: {
      companyId: session.user.companyId!,
      propertyId: parsed.data.propertyId,
      unitId: parsed.data.unitId || ownership.unitId || null,
      tenantId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      images: [],
    },
  })

  revalidateAllLocales('/owner/tickets')
  return { success: true, data: ticket }
}
