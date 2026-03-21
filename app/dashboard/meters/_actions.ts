'use server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getAllReadings() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []
  return prisma.meterReading.findMany({
    where: { companyId: session.user.companyId },
    include: { tenant: { select: { name: true } }, lease: { include: { unit: { include: { property: { select: { name: true } } } } } } },
    orderBy: { readingDate: 'desc' },
    take: 100,
  })
}
