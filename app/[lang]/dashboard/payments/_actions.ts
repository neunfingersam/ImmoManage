'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const recordPaymentSchema = z.object({
  rentDemandId: z.string(),
  leaseId: z.string(),
  amount: z.number().positive(),
  paymentDate: z.string().datetime(),
  note: z.string().optional(),
})

export async function recordPaymentAction(data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  const parsed = recordPaymentSchema.parse(data)

  const payment = await prisma.payment.create({
    data: {
      companyId: session.user.companyId,
      rentDemandId: parsed.rentDemandId,
      leaseId: parsed.leaseId,
      amount: parsed.amount,
      paymentDate: new Date(parsed.paymentDate),
      method: 'MANUAL',
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
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { amount: parsed.amount, leaseId: parsed.leaseId },
    },
  })

  revalidatePath('/dashboard/payments')
}

export async function sendReminderAction(rentDemandId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  // Aktuellen Mahnlevel ermitteln
  const lastReminder = await prisma.paymentReminder.findFirst({
    where: { rentDemandId },
    orderBy: { level: 'desc' },
  })

  const nextLevel = (lastReminder?.level ?? 0) + 1
  if (nextLevel > 3) throw new Error('Maximale Mahnstufe erreicht')

  await prisma.paymentReminder.create({
    data: {
      companyId: session.user.companyId,
      rentDemandId,
      level: nextLevel,
      sentAt: new Date(),
    },
  })

  // TODO Plan D: E-Mail aus Mahnvorlage generieren und senden
  // Für jetzt: nur DB-Eintrag

  revalidatePath('/dashboard/payments')

  return { level: nextLevel }
}
