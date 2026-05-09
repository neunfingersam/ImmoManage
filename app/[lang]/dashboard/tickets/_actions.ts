'use server'
import { revalidateAllLocales } from '@/lib/revalidate'

import { prisma } from '@/lib/prisma'
import { getAuthSession, withAuthAction } from '@/lib/action-utils'
import { getTicketWhere, getPropertyWhere } from '@/lib/access-control'
import { commentSchema, updateStatusSchema, ticketSchema, type TicketFormValues } from '@/lib/schemas/ticket'
import type { ActionResult } from '@/lib/action-result'
import type { Ticket, TicketComment } from '@/lib/generated/prisma'
import { sendPushToUser } from '@/lib/push'

const DONE_PAGE_SIZE = 20

export async function getTickets(donePage = 1, search = '') {
  const session = await getAuthSession()
  if (!session) return { open: [], inProgress: [], done: [], doneTotal: 0 }

  const include = {
    tenant: { select: { id: true, name: true } },
    property: { select: { id: true, name: true } },
    unit: { select: { id: true, unitNumber: true } },
  }
  const baseWhere = getTicketWhere(session)
  const searchFilter = search.trim()
    ? { OR: [{ title: { contains: search.trim() } }, { description: { contains: search.trim() } }, { tenant: { name: { contains: search.trim() } } }] }
    : {}

  const openWhere = { ...baseWhere, status: 'OPEN' as const, ...searchFilter }
  const inProgressWhere = { ...baseWhere, status: 'IN_PROGRESS' as const, ...searchFilter }
  const doneWhere = { ...baseWhere, status: 'DONE' as const, ...searchFilter }

  const [open, inProgress, done, doneTotal] = await Promise.all([
    prisma.ticket.findMany({ where: openWhere, include, orderBy: { createdAt: 'desc' } }),
    prisma.ticket.findMany({ where: inProgressWhere, include, orderBy: { createdAt: 'desc' } }),
    prisma.ticket.findMany({ where: doneWhere, include, orderBy: { createdAt: 'desc' }, skip: (donePage - 1) * DONE_PAGE_SIZE, take: DONE_PAGE_SIZE }),
    prisma.ticket.count({ where: doneWhere }),
  ])

  return { open, inProgress, done, doneTotal }
}

export async function getTicket(ticketId: string) {
  const session = await getAuthSession()
  if (!session) return null

  return prisma.ticket.findFirst({
    where: { id: ticketId, ...getTicketWhere(session) },
    include: {
      tenant: { select: { id: true, name: true, email: true, phone: true } },
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, unitNumber: true } },
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export async function updateTicketStatus(ticketId: string, data: { status: string }): Promise<ActionResult<Ticket>> {
  return withAuthAction(async (session) => {
    const parsed = updateStatusSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: (parsed.error as any).issues?.[0]?.message ?? parsed.error.message }

    const existing = await prisma.ticket.findFirst({
      where: { id: ticketId, ...getTicketWhere(session) },
    })
    if (!existing) return { success: false, error: 'Ticket nicht gefunden' }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: parsed.data.status },
    })
    revalidateAllLocales('/dashboard/tickets')
    revalidateAllLocales(`/dashboard/tickets/${ticketId}`)
    if (ticket.tenantId) {
      sendPushToUser(
        ticket.tenantId,
        'Meldung aktualisiert',
        `Status deiner Meldung "${ticket.title}" wurde geändert.`,
        `/tenant/tickets/${ticket.id}`,
      ).catch(() => {})
    }
    return { success: true, data: ticket }
  })
}

export async function updateRepairCost(ticketId: string, repairCost: number | null): Promise<ActionResult<Ticket>> {
  return withAuthAction(async (session) => {
    const existing = await prisma.ticket.findFirst({
      where: { id: ticketId, ...getTicketWhere(session) },
    })
    if (!existing) return { success: false, error: 'Ticket nicht gefunden' }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { repairCost },
    })
    revalidateAllLocales(`/dashboard/tickets/${ticketId}`)
    revalidateAllLocales('/dashboard/tax')
    return { success: true, data: ticket }
  })
}

export async function getStaffTicketOptions() {
  const session = await getAuthSession()
  if (!session) return []

  const properties = await prisma.property.findMany({
    where: getPropertyWhere(session),
    include: { units: { select: { id: true, unitNumber: true, floor: true } } },
    orderBy: { name: 'asc' },
  })

  return properties.flatMap(p =>
    p.units.map(u => {
      const floorLabel = u.floor !== null && u.floor !== undefined
        ? u.floor === 0 ? ' (EG)' : ` (${u.floor}. OG)`
        : ''
      return {
        propertyId: p.id,
        propertyName: p.address || p.name,
        unitId: u.id,
        unitNumber: `Whg. ${u.unitNumber}${floorLabel}`,
      }
    })
  )
}

export async function createStaffTicket(data: TicketFormValues): Promise<ActionResult<Ticket>> {
  return withAuthAction(async (session) => {
    const parsed = ticketSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

    const property = await prisma.property.findFirst({
      where: { id: parsed.data.propertyId, ...getPropertyWhere(session) },
    })
    if (!property) return { success: false, error: 'Immobilie nicht gefunden oder kein Zugriff' }

    const ticket = await prisma.ticket.create({
      data: {
        companyId: session.user.companyId!,
        propertyId: parsed.data.propertyId,
        unitId: parsed.data.unitId ?? null,
        tenantId: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        scope: parsed.data.scope,
        status: 'OPEN',
        images: JSON.stringify(parsed.data.images ?? []),
      },
    })

    revalidateAllLocales('/dashboard/tickets')
    return { success: true, data: ticket }
  })
}

export async function addComment(ticketId: string, data: { text: string }): Promise<ActionResult<TicketComment>> {
  return withAuthAction(async (session) => {
    const parsed = commentSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: (parsed.error as any).issues?.[0]?.message ?? parsed.error.message }

    const existing = await prisma.ticket.findFirst({
      where: { id: ticketId, ...getTicketWhere(session) },
    })
    if (!existing) return { success: false, error: 'Ticket nicht gefunden' }

    const comment = await prisma.ticketComment.create({
      data: { ticketId, authorId: session.user.id, text: parsed.data.text },
    })
    revalidateAllLocales(`/dashboard/tickets/${ticketId}`)
    return { success: true, data: comment }
  })
}
