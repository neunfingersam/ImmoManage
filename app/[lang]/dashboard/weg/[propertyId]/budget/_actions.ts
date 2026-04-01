'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ActionResult } from '@/lib/action-result'

const budgetSchema = z.object({
  jahr: z.number().int().min(2020).max(2100),
  positionen: z.array(z.object({
    kategorie: z.string().min(1),
    beschreibung: z.string().min(1),
    budgetBetrag: z.number().positive(),
    notizen: z.string().optional(),
  })).min(1),
})

export async function getStegBudgets(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []
  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) return []
  return prisma.stegBudget.findMany({ where: { propertyId }, include: { positionen: true }, orderBy: { jahr: 'desc' } })
}

export async function getStegBudgetWithIst(propertyId: string, jahr: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const budget = await prisma.stegBudget.findUnique({
    where: { propertyId_jahr: { propertyId, jahr } },
    include: { positionen: true },
  })
  if (!budget) return null

  const [communityExpenses, hauswartEntries, wegConfig] = await Promise.all([
    prisma.communityExpense.findMany({
      where: { wegConfig: { propertyId }, status: 'BEZAHLT', faelligkeitsdatum: { gte: new Date(jahr, 0, 1), lt: new Date(jahr + 1, 0, 1) } },
    }),
    prisma.hauswartEntry.findMany({
      where: { propertyId, datum: { gte: new Date(jahr, 0, 1), lt: new Date(jahr + 1, 0, 1) } },
    }),
    prisma.wegConfig.findFirst({ where: { propertyId } }),
  ])

  const stundenansatz = wegConfig?.hauswartStundenansatz ?? 45
  const hauswartIst =
    hauswartEntries.filter(e => e.kategorie === 'STUNDEN').reduce((s, e) => s + (e.stunden ?? 0) * stundenansatz, 0) +
    hauswartEntries.filter(e => e.kategorie !== 'STUNDEN').reduce((s, e) => s + (e.betrag ?? 0), 0)

  const positionenMitIst = budget.positionen.map((pos) => {
    let ist = communityExpenses.filter(e => e.kategorie === pos.kategorie).reduce((s, e) => s + e.betrag, 0)
    if (pos.kategorie === 'HAUSWART') ist = hauswartIst
    return { ...pos, istBetrag: ist }
  })

  return { ...budget, positionen: positionenMitIst }
}

export async function createStegBudget(propertyId: string, data: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) return { success: false, error: 'Liegenschaft nicht gefunden' }

  const parsed = budgetSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const existing = await prisma.stegBudget.findUnique({ where: { propertyId_jahr: { propertyId, jahr: parsed.data.jahr } } })
  if (existing) return { success: false, error: `Budget für ${parsed.data.jahr} existiert bereits` }

  const budget = await prisma.stegBudget.create({
    data: {
      propertyId, companyId: session.user.companyId, jahr: parsed.data.jahr,
      positionen: { create: parsed.data.positionen.map(p => ({ kategorie: p.kategorie as any, beschreibung: p.beschreibung, budgetBetrag: p.budgetBetrag, notizen: p.notizen ?? null })) },
    },
  })

  revalidatePath(`/dashboard/weg/${propertyId}/budget`)
  return { success: true, data: { id: budget.id } }
}

export async function updateBudgetStatus(budgetId: string, status: 'ENTWURF' | 'VERABSCHIEDET' | 'ABGESCHLOSSEN'): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const budget = await prisma.stegBudget.findFirst({ where: { id: budgetId, companyId: session.user.companyId } })
  if (!budget) return { success: false, error: 'Budget nicht gefunden' }

  await prisma.stegBudget.update({ where: { id: budgetId }, data: { status } })
  revalidatePath(`/dashboard/weg/${budget.propertyId}/budget`)
  return { success: true, data: null }
}
