'use server'

import { revalidateAllLocales } from '@/lib/revalidate'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ActionResult } from '@/lib/action-result'
import type { HauswartEntry } from '@/lib/generated/prisma'

const entrySchema = z.object({
  datum: z.string().min(1),
  kategorie: z.enum(['STUNDEN', 'SPESEN', 'MATERIAL', 'FREMDLEISTUNG']),
  beschreibung: z.string().min(1),
  stunden: z.number().positive().optional(),
  betrag: z.number().positive().optional(),
})

export async function getHauswartEntries(propertyId: string, filter?: { monat?: number; jahr?: number }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []

  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId: session.user.companyId },
  })
  if (!property) return []

  const where: Record<string, unknown> = { propertyId, companyId: session.user.companyId }
  if (filter?.jahr) {
    const year = filter.jahr
    const from = filter.monat ? new Date(year, filter.monat - 1, 1) : new Date(year, 0, 1)
    const to = filter.monat ? new Date(year, filter.monat, 1) : new Date(year + 1, 0, 1)
    where.datum = { gte: from, lt: to }
  }

  return prisma.hauswartEntry.findMany({
    where,
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: { datum: 'desc' },
  })
}

export async function createHauswartEntry(propertyId: string, data: unknown): Promise<ActionResult<HauswartEntry>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) return { success: false, error: 'Liegenschaft nicht gefunden' }

  const parsed = entrySchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { datum, kategorie, beschreibung, stunden, betrag } = parsed.data
  if (kategorie === 'STUNDEN' && !stunden) return { success: false, error: 'Stunden erforderlich' }
  if (kategorie !== 'STUNDEN' && !betrag) return { success: false, error: 'Betrag erforderlich' }

  const entry = await prisma.hauswartEntry.create({
    data: { companyId: session.user.companyId, propertyId, datum: new Date(datum), kategorie, beschreibung, stunden: stunden ?? null, betrag: betrag ?? null, createdById: session.user.id },
  })
  revalidateAllLocales(`/dashboard/weg/${propertyId}/hauswart`)
  return { success: true, data: entry }
}

export async function updateHauswartEntry(entryId: string, data: unknown): Promise<ActionResult<HauswartEntry>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const existing = await prisma.hauswartEntry.findFirst({ where: { id: entryId, companyId: session.user.companyId } })
  if (!existing) return { success: false, error: 'Eintrag nicht gefunden' }

  const parsed = entrySchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { datum, kategorie, beschreibung, stunden, betrag } = parsed.data
  const entry = await prisma.hauswartEntry.update({
    where: { id: entryId },
    data: { datum: new Date(datum), kategorie, beschreibung, stunden: stunden ?? null, betrag: betrag ?? null },
  })
  revalidateAllLocales(`/dashboard/weg/${existing.propertyId}/hauswart`)
  return { success: true, data: entry }
}

export async function deleteHauswartEntry(entryId: string): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const entry = await prisma.hauswartEntry.findFirst({ where: { id: entryId, companyId: session.user.companyId } })
  if (!entry) return { success: false, error: 'Eintrag nicht gefunden' }

  await prisma.hauswartEntry.delete({ where: { id: entryId } })
  revalidateAllLocales(`/dashboard/weg/${entry.propertyId}/hauswart`)
  return { success: true, data: null }
}

export async function getHauswartMonthTotal(propertyId: string, monat: number, jahr: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { stunden: 0, stundenkosten: 0, auslagen: 0, total: 0 }

  const wegConfig = await prisma.wegConfig.findFirst({ where: { propertyId } })
  const stundenansatz = wegConfig?.hauswartStundenansatz ?? 45

  const entries = await getHauswartEntries(propertyId, { monat, jahr })
  const stunden = entries.filter(e => e.kategorie === 'STUNDEN').reduce((s, e) => s + (e.stunden ?? 0), 0)
  const auslagen = entries.filter(e => e.kategorie !== 'STUNDEN').reduce((s, e) => s + (e.betrag ?? 0), 0)
  const stundenkosten = stunden * stundenansatz
  return { stunden, stundenkosten, auslagen, total: stundenkosten + auslagen }
}
