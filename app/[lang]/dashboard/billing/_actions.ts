'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ActionResult } from '@/lib/action-result'
import type { UtilityBill } from '@/lib/generated/prisma'

const billSchema = z.object({
  leaseId: z.string().min(1),
  propertyId: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  amount: z.number().positive('Betrag muss positiv sein'),
})

export async function getBills() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []
  return prisma.utilityBill.findMany({
    where: { companyId: session.user.companyId },
    include: {
      lease: { include: { tenant: { select: { id: true, name: true } }, unit: { select: { unitNumber: true } } } },
      property: { select: { id: true, name: true } },
    },
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function createBill(data: { leaseId: string; propertyId: string; year: number; amount: number }): Promise<ActionResult<UtilityBill>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = billSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

  const bill = await prisma.utilityBill.create({
    data: {
      ...parsed.data,
      companyId: session.user.companyId,
    },
  })
  revalidatePath('/dashboard/billing')
  return { success: true, data: bill }
}

export async function getLeasesForBilling() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []
  return prisma.lease.findMany({
    where: { companyId: session.user.companyId, status: 'ACTIVE' },
    include: {
      tenant: { select: { name: true } },
      unit: { include: { property: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
