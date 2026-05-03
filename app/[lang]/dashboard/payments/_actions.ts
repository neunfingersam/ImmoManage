'use server'
import { revalidateAllLocales } from '@/lib/revalidate'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'

const recordPaymentSchema = z.object({
  rentDemandId: z.string(),
  amount: z.number().positive(),
  paymentDate: z.string().min(1),
  note: z.string().optional(),
})

export async function recordPaymentAction(data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = recordPaymentSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Daten' }

  // Verify RentDemand belongs to this company
  const demandCheck = await prisma.rentDemand.findFirst({
    where: { id: parsed.data.rentDemandId, companyId: session.user.companyId },
  })
  if (!demandCheck) return { success: false, error: 'Nicht autorisiert' }

  const payment = await prisma.payment.create({
    data: {
      rentDemandId: parsed.data.rentDemandId,
      amount: parsed.data.amount,
      paymentDate: new Date(parsed.data.paymentDate),
      method: 'BANK_TRANSFER',
      note: parsed.data.note,
    },
  })

  // RentDemand Status aktualisieren
  const demand = await prisma.rentDemand.findUnique({
    where: { id: parsed.data.rentDemandId },
    include: { payments: true },
  })

  if (demand) {
    const totalPaid = demand.payments.reduce((sum, p) => sum + p.amount, 0)
    const newStatus = totalPaid >= demand.amount ? 'PAID' : demand.dueDate < new Date() ? 'OVERDUE' : 'PENDING'

    await prisma.rentDemand.update({
      where: { id: parsed.data.rentDemandId },
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
      meta: { amount: parsed.data.amount },
    },
  })

  revalidateAllLocales('/dashboard/payments')
  return { success: true, data: null }
}

export async function bulkRecordPaymentsAction(
  matches: { rentDemandId: string; amount: number; paymentDate: string; note?: string }[]
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { count: 0 }

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

  revalidateAllLocales('/dashboard/payments')
  return { count: authorizedMatches.length }
}

export async function sendReminderAction(rentDemandId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false as const, error: 'Nicht autorisiert' }

  // Verify RentDemand belongs to this company
  const demand = await prisma.rentDemand.findFirst({
    where: { id: rentDemandId, companyId: session.user.companyId },
    include: {
      lease: {
        include: {
          tenant: { select: { name: true, email: true } },
          unit: { include: { property: { select: { name: true } } } },
        },
      },
    },
  })
  if (!demand) return { success: false as const, error: 'Nicht autorisiert' }

  // Aktuellen Mahnlevel ermitteln
  const lastReminder = await prisma.paymentReminder.findFirst({
    where: { rentDemandId },
    orderBy: { level: 'desc' },
  })

  const nextLevel = (lastReminder?.level ?? 0) + 1
  if (nextLevel > 3) return { success: false as const, error: 'Maximale Mahnstufe erreicht' }

  await prisma.paymentReminder.create({
    data: { rentDemandId, level: nextLevel },
  })

  // Send reminder email to tenant
  const tenant = demand.lease?.tenant
  if (tenant?.email) {
    const levelLabel = ['', 'Zahlungserinnerung', '1. Mahnung', '2. Mahnung'][nextLevel] ?? `Mahnung ${nextLevel}`
    const dueDate = new Date(demand.dueDate).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const amount = demand.amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const propertyName = demand.lease?.unit?.property?.name ?? ''
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #E8734A; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 18px;">${levelLabel}</h1>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p>Hallo ${tenant.name},</p>
          <p>wir möchten Sie darauf aufmerksam machen, dass folgende Mietzahlung noch ausstehend ist:</p>
          <table style="margin: 16px 0; border-collapse: collapse;">
            <tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">Objekt:</td><td>${propertyName}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">Betrag:</td><td>CHF ${amount}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">Fällig seit:</td><td>${dueDate}</td></tr>
          </table>
          <p>Bitte begleichen Sie den ausstehenden Betrag umgehend. Bei Fragen wenden Sie sich an Ihre Hausverwaltung.</p>
        </div>
      </div>
    `
    await sendEmail(tenant.email, `${levelLabel} — ${propertyName}`, html).catch(() => {})
  }

  revalidateAllLocales('/dashboard/payments')
  return { success: true as const, level: nextLevel }
}
