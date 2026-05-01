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
    try {
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
    } catch (e: unknown) {
      // Unique constraint violation = demand already exists for this lease/month/year
      const isUniqueViolation =
        e instanceof Error &&
        (e.message.includes('Unique constraint') || e.message.includes('SQLITE_CONSTRAINT') || e.message.includes('UNIQUE constraint'))
      if (isUniqueViolation) {
        skipped++
      } else {
        throw e
      }
    }
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
