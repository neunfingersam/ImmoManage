'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ActionResult } from '@/lib/action-result'
import type { UtilityBill } from '@/lib/generated/prisma'
import { calculateTenantShares, type CostItem } from '@/lib/utility-billing'

const costItemSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  key: z.enum(['sqm', 'unit', 'persons']),
})

const billSchema = z.object({
  leaseId: z.string().min(1),
  propertyId: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  amount: z.number().positive('Betrag muss positiv sein'),
  costItems: z.array(costItemSchema).min(1),
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

export async function createBill(data: {
  leaseId: string
  propertyId: string
  year: number
  amount: number
  costItems: CostItem[]
}): Promise<ActionResult<UtilityBill>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = billSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

  // Einheiten des Objekts laden für Mieteranteil-Berechnung
  const units = await prisma.unit.findMany({
    where: { propertyId: parsed.data.propertyId },
    include: {
      leases: {
        where: { status: 'ACTIVE' },
        include: { tenant: { select: { id: true, name: true } } },
      },
    },
  })

  const unitData = units
    .filter((u) => u.leases.length > 0)
    .map((u) => ({
      id: u.id,
      size: u.size ?? 0,
      persons: 2, // TODO: Personenzahl auf Unit erfassen
      tenantId: u.leases[0].tenantId,
      tenantName: u.leases[0].tenant.name,
      akontoTotal: u.leases[0].extraCosts * 12,
    }))

  const tenantShares = calculateTenantShares(parsed.data.costItems, unitData)

  const bill = await prisma.utilityBill.create({
    data: {
      leaseId: parsed.data.leaseId,
      propertyId: parsed.data.propertyId,
      year: parsed.data.year,
      amount: parsed.data.amount,
      companyId: session.user.companyId,
      costItems: JSON.stringify(parsed.data.costItems),
      tenantShares: JSON.stringify(tenantShares),
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

// ─── Company payment settings (IBAN + address) ────────────────────────────────

const paymentSettingsSchema = z.object({
  bankIban: z.string().min(15, 'Bitte gültige IBAN eingeben'),
  bankName: z.string().optional(),
  street: z.string().min(1, 'Strasse erforderlich'),
  zip: z.string().min(4, 'PLZ erforderlich'),
  city: z.string().min(1, 'Ort erforderlich'),
})

export async function getPaymentSettings() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null
  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { smtpConfig: true },
  })
  const cfg = company?.smtpConfig as Record<string, string> | null
  return {
    bankIban: cfg?.bankIban ?? '',
    bankName: cfg?.bankName ?? '',
    street: cfg?.street ?? '',
    zip: cfg?.zip ?? '',
    city: cfg?.city ?? '',
  }
}

export async function savePaymentSettings(data: unknown): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  if (session.user.role !== 'ADMIN') return { success: false, error: 'Nur Admins können das ändern' }

  const parsed = paymentSettingsSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { smtpConfig: true },
  })
  const existing = (company?.smtpConfig ?? {}) as Record<string, string>

  await prisma.company.update({
    where: { id: session.user.companyId },
    data: {
      smtpConfig: {
        ...existing,
        bankIban: parsed.data.bankIban.replace(/\s/g, ''),
        bankName: parsed.data.bankName ?? '',
        street: parsed.data.street,
        zip: parsed.data.zip,
        city: parsed.data.city,
      },
    },
  })

  revalidatePath('/dashboard/billing')
  return { success: true, data: null }
}
