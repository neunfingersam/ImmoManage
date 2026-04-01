'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/lib/action-result'

export async function getJahresabrechnungen(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []
  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) return []
  return prisma.stegJahresabrechnung.findMany({
    where: { propertyId },
    include: { ownerStatements: { include: { owner: { include: { user: { select: { id: true, name: true } } } } } } },
    orderBy: { jahr: 'desc' },
  })
}

export async function generateJahresabrechnung(propertyId: string, jahr: number): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId: session.user.companyId },
    include: { owners: true, wegConfig: true },
  })
  if (!property) return { success: false, error: 'Liegenschaft nicht gefunden' }

  const owners = property.owners
  const totalMea = owners.reduce((s, o) => s + (o.mea ?? 0), 0)
  if (totalMea === 0) return { success: false, error: 'MEA für Eigentümer hinterlegen (Total muss > 0 sein)' }

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
  const hauswartKosten =
    hauswartEntries.filter(e => e.kategorie === 'STUNDEN').reduce((s, e) => s + (e.stunden ?? 0) * stundenansatz, 0) +
    hauswartEntries.filter(e => e.kategorie !== 'STUNDEN').reduce((s, e) => s + (e.betrag ?? 0), 0)
  const communityTotal = communityExpenses.reduce((s, e) => s + e.betrag, 0)
  const totalAusgaben = communityTotal + hauswartKosten
  const fondsBeitragssatz = (wegConfig?.fondsBeitragssatz ?? 0.4) / 100
  const fondsBeitrag = totalAusgaben * fondsBeitragssatz

  const ja = await prisma.stegJahresabrechnung.upsert({
    where: { propertyId_jahr: { propertyId, jahr } },
    update: { totalAusgaben, fondsBeitrag, status: 'ENTWURF' },
    create: { propertyId, companyId: session.user.companyId, jahr, totalAusgaben, fondsBeitrag },
  })

  for (const owner of owners) {
    const payments = await prisma.ownerExpensePayment.findMany({
      where: { ownerId: owner.id, bezahltAm: { gte: new Date(jahr, 0, 1), lt: new Date(jahr + 1, 0, 1) }, status: 'BEZAHLT' },
    })
    const vorauszahlungen = payments.reduce((s, p) => s + p.betrag, 0)
    const kostenanteil = (totalAusgaben * (owner.mea ?? 0)) / totalMea
    const fondsanteil = (fondsBeitrag * (owner.mea ?? 0)) / totalMea
    const saldo = kostenanteil + fondsanteil - vorauszahlungen

    await prisma.stegOwnerStatement.upsert({
      where: { jahresabrechnungId_ownerId: { jahresabrechnungId: ja.id, ownerId: owner.id } },
      update: { kostenanteil, fondsanteil, vorauszahlungen, saldo },
      create: { jahresabrechnungId: ja.id, ownerId: owner.id, kostenanteil, fondsanteil, vorauszahlungen, saldo },
    })
  }

  revalidatePath(`/dashboard/weg/${propertyId}/jahresabrechnung`)
  return { success: true, data: { id: ja.id } }
}

export async function updateJahresabrechnungStatus(id: string, status: 'ENTWURF' | 'VERSANDT' | 'GENEHMIGT'): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  const ja = await prisma.stegJahresabrechnung.findFirst({ where: { id, companyId: session.user.companyId } })
  if (!ja) return { success: false, error: 'Nicht gefunden' }
  await prisma.stegJahresabrechnung.update({ where: { id }, data: { status } })
  revalidatePath(`/dashboard/weg/${ja.propertyId}/jahresabrechnung`)
  return { success: true, data: null }
}
