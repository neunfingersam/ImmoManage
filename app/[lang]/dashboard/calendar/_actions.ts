'use server'
import { revalidateAllLocales } from '@/lib/revalidate'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireCompanyAccess } from '@/lib/auth-guard'
import { sendPushToUser } from '@/lib/push'
import type { ActionResult } from '@/lib/action-result'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CalendarEvent = any

const eventSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  date: z.string().min(1, 'Datum ist erforderlich'),
  type: z.enum(['VERTRAGSENDE', 'ABLESUNG', 'KUENDIGUNG', 'WARTUNG', 'SONSTIGES']),
  propertyId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
})

export async function getEvents() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []
  return prisma.calendarEvent.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { date: 'asc' },
    include: {
      user: { select: { id: true, name: true } },
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, unitNumber: true } },
    },
  })
}

export async function createEvent(data: {
  title: string; date: string; type: string; propertyId?: string | null; unitId?: string | null
}): Promise<ActionResult<CalendarEvent>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)

  const parsed = eventSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

  const event = await prisma.calendarEvent.create({
    data: {
      companyId: session.user.companyId,
      userId: session.user.id,
      title: parsed.data.title,
      date: new Date(parsed.data.date),
      type: parsed.data.type,
      propertyId: parsed.data.propertyId ?? null,
      unitId: parsed.data.unitId ?? null,
    },
  })

  // Betroffene Mieter benachrichtigen
  await notifyAffectedTenants(event, session.user.companyId)

  revalidateAllLocales('/dashboard/calendar')
  return { success: true, data: event }
}

async function notifyAffectedTenants(event: CalendarEvent, companyId: string) {
  let affectedTenantIds: string[] = []

  if (event.unitId) {
    // Nur Mieter in dieser Einheit
    const leases = await prisma.lease.findMany({
      where: { unitId: event.unitId, status: 'ACTIVE' },
      select: { tenantId: true },
    })
    affectedTenantIds = leases.map((l: { tenantId: string }) => l.tenantId)
  } else if (event.propertyId) {
    // Alle Mieter der Immobilie
    const leases = await prisma.lease.findMany({
      where: { unit: { propertyId: event.propertyId }, status: 'ACTIVE' },
      select: { tenantId: true },
    })
    affectedTenantIds = leases.map((l: { tenantId: string }) => l.tenantId)
  }
  // Wenn weder propertyId noch unitId: keine automatische Notification

  const dateStr = new Date(event.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Immobilienname für E-Mail ermitteln
  let propertyName: string | undefined
  if (event.propertyId) {
    const property = await prisma.property.findUnique({ where: { id: event.propertyId }, select: { name: true } })
    propertyName = property?.name ?? undefined
  }

  for (const tenantId of affectedTenantIds) {
    await prisma.notification.create({
      data: {
        userId: tenantId,
        type: 'CALENDAR_EVENT',
        text: `Neuer Termin am ${dateStr}: ${event.title}`,
        link: '/tenant/calendar',
      },
    })

    // Push-Benachrichtigung (fire-and-forget)
    sendPushToUser(
      tenantId,
      'Neuer Termin',
      `${event.title} — ${dateStr}`,
      `/tenant/calendar`,
    ).catch(() => {})

    // E-Mail-Benachrichtigung (fire-and-forget)
    ;(async () => {
      try {
        const { sendEventNotificationEmail } = await import('@/lib/email')
        const tenantUser = await prisma.user.findUnique({ where: { id: tenantId }, select: { name: true, email: true } })
        if (tenantUser?.email) {
          await sendEventNotificationEmail({
            tenantEmail: tenantUser.email,
            tenantName: tenantUser.name ?? tenantUser.email,
            eventTitle: event.title,
            eventDate: new Date(event.date),
            propertyName,
          })
        }
      } catch { /* Email optional */ }
    })()
  }
}

export async function deleteEvent(eventId: string): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)
  await prisma.calendarEvent.deleteMany({ where: { id: eventId, companyId: session.user.companyId } })
  revalidateAllLocales('/dashboard/calendar')
  return { success: true, data: undefined }
}

export async function getPropertiesAndUnits() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { properties: [], units: [] }
  const properties = await prisma.property.findMany({
    where: { companyId: session.user.companyId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  const units = await prisma.unit.findMany({
    where: { property: { companyId: session.user.companyId } },
    select: { id: true, unitNumber: true, propertyId: true },
    orderBy: { unitNumber: 'asc' },
  })
  return { properties, units }
}
