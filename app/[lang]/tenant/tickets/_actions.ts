'use server'

import { revalidateAllLocales } from '@/lib/revalidate'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ticketSchema, type TicketFormValues } from '@/lib/schemas/ticket'
import type { ActionResult } from '@/lib/action-result'
import type { Ticket, TicketComment } from '@/lib/generated/prisma'
import { sendPushToUser } from '@/lib/push'

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
        scope: parsed.data.scope,
        status: 'OPEN',
        images: JSON.stringify(parsed.data.images ?? []),
      },
    })
    revalidateAllLocales('/tenant/tickets')
    prisma.user.findMany({
      where: { companyId: session.user.companyId, role: { in: ['ADMIN', 'VERMIETER'] }, active: true },
      select: { id: true },
    }).then((staff) => {
      staff.forEach((s) =>
        sendPushToUser(s.id, 'Neue Schadensmeldung', `${session.user.name ?? 'Ein Mieter'}: ${parsed.data.title}`, `/dashboard/tickets`).catch(() => {}),
      )
    }).catch(() => {})
    return { success: true, data: ticket }
  } catch (e) {
    return { success: false, error: 'Fehler beim Erstellen der Meldung' }
  }
}

export async function addTenantComment(ticketId: string, data: { text: string }): Promise<ActionResult<TicketComment>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Nicht autorisiert' }

  const text = data.text?.trim()
  if (!text) return { success: false, error: 'Kommentar darf nicht leer sein' }

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, tenantId: session.user.id },
    select: { id: true },
  })
  if (!ticket) return { success: false, error: 'Meldung nicht gefunden' }

  try {
    const comment = await prisma.ticketComment.create({
      data: { ticketId, authorId: session.user.id, text },
    })
    revalidateAllLocales(`/tenant/tickets/${ticketId}`)
    return { success: true, data: comment }
  } catch {
    return { success: false, error: 'Fehler beim Speichern des Kommentars' }
  }
}
