import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateRentDemandAmount, getDueDate } from '@/lib/payments'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companyId = session.user.companyId
  const now = new Date()
  const month = now.getMonth() + 1 // 1–12
  const year = now.getFullYear()
  const dueDate = getDueDate(now)

  // Alle aktiven Leases der Company laden
  const activeLeases = await prisma.lease.findMany({
    where: { companyId, status: 'ACTIVE' },
    select: { id: true, coldRent: true, extraCosts: true },
  })

  let created = 0
  let skipped = 0

  for (const lease of activeLeases) {
    // Idempotenz: prüfen ob Eintrag für diesen Monat bereits existiert
    const existing = await prisma.rentDemand.findFirst({
      where: { leaseId: lease.id, month, year },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.rentDemand.create({
      data: {
        companyId,
        leaseId: lease.id,
        month,
        year,
        amount: calculateRentDemandAmount(lease),
        status: 'PENDING',
        dueDate,
      },
    })
    created++
  }

  // ActivityLog schreiben
  await prisma.activityLog.create({
    data: {
      companyId,
      userId: session.user.id,
      action: 'RENT_DEMANDS_GENERATED',
      entity: 'RentDemand',
      meta: { created, skipped, month, year },
    },
  })

  return NextResponse.json({ created, skipped })
}
