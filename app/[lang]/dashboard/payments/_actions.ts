'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const recordPaymentSchema = z.object({
  rentDemandId: z.string(),
  amount: z.number().positive(),
  paymentDate: z.string().datetime(),
  note: z.string().optional(),
})

export async function recordPaymentAction(data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  const parsed = recordPaymentSchema.parse(data)

  // Verify RentDemand belongs to this company
  const demandCheck = await prisma.rentDemand.findFirst({
    where: { id: parsed.rentDemandId, companyId: session.user.companyId },
  })
  if (!demandCheck) throw new Error('Nicht autorisiert')

  const payment = await prisma.payment.create({
    data: {
      rentDemandId: parsed.rentDemandId,
      amount: parsed.amount,
      paymentDate: new Date(parsed.paymentDate),
      method: 'BANK_TRANSFER',
      note: parsed.note,
    },
  })

  // RentDemand Status aktualisieren
  const demand = await prisma.rentDemand.findUnique({
    where: { id: parsed.rentDemandId },
    include: { payments: true },
  })

  if (demand) {
    const totalPaid = demand.payments.reduce((sum, p) => sum + p.amount, 0)
    const newStatus = totalPaid >= demand.amount ? 'PAID' : demand.dueDate < new Date() ? 'OVERDUE' : 'PENDING'

    await prisma.rentDemand.update({
      where: { id: parsed.rentDemandId },
      data: { status: newStatus },
    })
  }

  // ActivityLog
  await prisma.activityLog.create({
    data: {
      companyId: session.user.companyId,
      userId: session.user.id,
      action: 'PAYMENT_RECORDED',
      entity: 'Payment',
      entityId: payment.id,
      meta: { amount: parsed.amount },
    },
  })

  revalidatePath('/dashboard/payments')
}

export async function bulkRecordPaymentsAction(
  matches: { rentDemandId: string; amount: number; paymentDate: string; note?: string }[]
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  const demandIds = matches.map((m) => m.rentDemandId)
  const validDemands = await prisma.rentDemand.findMany({
    where: { id: { in: demandIds }, companyId: session.user.companyId },
    select: { id: true, amount: true, dueDate: true },
  })
  const validIds = new Set(validDemands.map((d) => d.id))
  const authorizedMatches = matches.filter((m) => validIds.has(m.rentDemandId))

  await prisma.$transaction(async (tx) => {
    for (const m of authorizedMatches) {
      const payment = await tx.payment.create({
        data: {
          rentDemandId: m.rentDemandId,
          amount: m.amount,
          paymentDate: new Date(m.paymentDate),
          method: 'BANK_TRANSFER',
          note: m.note,
        },
      })

      const demand = validDemands.find((d) => d.id === m.rentDemandId)!
      const allPayments = await tx.payment.findMany({ where: { rentDemandId: m.rentDemandId } })
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)
      const newStatus = totalPaid >= demand.amount ? 'PAID' : demand.dueDate < new Date() ? 'OVERDUE' : 'PENDING'

      await tx.rentDemand.update({ where: { id: m.rentDemandId }, data: { status: newStatus } })
      await tx.activityLog.create({
        data: {
          companyId: session.user.companyId!,
          userId: session.user.id,
          action: 'PAYMENT_RECORDED',
          entity: 'Payment',
          entityId: payment.id,
          meta: { amount: m.amount },
        },
      })
    }
  })

  revalidatePath('/dashboard/payments')
  return { count: authorizedMatches.length }
}

export async function sendReminderAction(rentDemandId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  // Verify RentDemand belongs to this company
  const demandCheck = await prisma.rentDemand.findFirst({
    where: { id: rentDemandId, companyId: session.user.companyId },
  })
  if (!demandCheck) throw new Error('Nicht autorisiert')

  // Aktuellen Mahnlevel ermitteln
  const lastReminder = await prisma.paymentReminder.findFirst({
    where: { rentDemandId },
    orderBy: { level: 'desc' },
  })

  const nextLevel = (lastReminder?.level ?? 0) + 1
  if (nextLevel > 3) throw new Error('Maximale Mahnstufe erreicht')

  await prisma.paymentReminder.create({
    data: {
      rentDemandId,
      level: nextLevel,
    },
  })

  // TODO Plan D: E-Mail aus Mahnvorlage generieren und senden
  // Für jetzt: nur DB-Eintrag

  revalidatePath('/dashboard/payments')

  return { level: nextLevel }
}
