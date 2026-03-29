'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// ─── Get all WEG properties for this company ─────────────────────────────────
export async function getWegProperties() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []
  return prisma.property.findMany({
    where: { companyId: session.user.companyId, isWeg: true },
    include: {
      wegConfig: true,
      units: true,
      owners: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── Get single WEG property ──────────────────────────────────────────────────
export async function getWegProperty(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null
  return prisma.property.findFirst({
    where: { id: propertyId, companyId: session.user.companyId, isWeg: true },
    include: {
      wegConfig: { include: { renewalItems: true, expenses: true } },
      units: { include: { owners: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } } } },
      owners: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          unit: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

// ─── Create WEG property (Step 1 of wizard) ───────────────────────────────────
const createWegSchema = z.object({
  name: z.string().min(1, 'Name erforderlich'),
  address: z.string().min(1, 'Adresse erforderlich'),
  unitCount: z.number().int().min(2, 'Mindestens 2 Einheiten'),
  year: z.number().int().min(1800).max(2100).optional(),
  kanton: z.string().optional(),
  gebVersicherungswert: z.number().positive().optional(),
})

export async function createWegProperty(data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = createWegSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const property = await prisma.property.create({
    data: {
      companyId: session.user.companyId,
      name: parsed.data.name,
      address: parsed.data.address,
      type: 'MULTI',
      isWeg: true,
      unitCount: parsed.data.unitCount,
      year: parsed.data.year,
      wegConfig: {
        create: {
          kanton: parsed.data.kanton,
          gebVersicherungswert: parsed.data.gebVersicherungswert,
        },
      },
    },
  })

  // Create units
  const units = Array.from({ length: parsed.data.unitCount }, (_, i) => ({
    propertyId: property.id,
    unitNumber: `${i + 1}`,
    status: 'LEER' as const,
  }))
  await prisma.unit.createMany({ data: units })

  await prisma.activityLog.create({
    data: {
      companyId: session.user.companyId,
      userId: session.user.id,
      action: 'WEG_CREATED',
      entity: 'Property',
      entityId: property.id,
      meta: { name: parsed.data.name },
    },
  })

  revalidatePath('/dashboard/weg')
  return { success: true, data: { id: property.id } }
}

// ─── Update WEG config ────────────────────────────────────────────────────────
const wegConfigSchema = z.object({
  kanton: z.string().optional(),
  gebVersicherungswert: z.number().positive('Gebäudeversicherungswert muss positiv sein').optional(),
  fondsBeitragssatz: z.number().min(0).max(10).optional(),
  fondsObergrenze: z.number().min(0).max(50).optional(),
  fondsStand: z.number().min(0).optional(),
})

export async function updateWegConfig(propertyId: string, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = wegConfigSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  await prisma.wegConfig.upsert({
    where: { propertyId },
    update: parsed.data,
    create: { propertyId, ...parsed.data },
  })

  revalidatePath(`/dashboard/weg/${propertyId}`)
  return { success: true, data: null }
}

// ─── Owner management ─────────────────────────────────────────────────────────
const ownerSchema = z.object({
  name: z.string().min(1, 'Name erforderlich'),
  email: z.string().email('Gültige E-Mail erforderlich'),
  phone: z.string().optional(),
  unitId: z.string().optional(),
  wertquote: z.number().min(0.01, 'Wertquote muss > 0 sein').max(100, 'Max. 100%'),
  hypothekarbetrag: z.number().min(0).optional(),
  hypothekarzins: z.number().min(0).max(20).optional(),
  bankverbindung: z.string().optional(),
  zahlungsIban: z.string().optional(),
})

export async function addWegOwner(propertyId: string, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = ownerSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  // Check total wertquote won't exceed 100%
  const existing = await prisma.propertyOwner.findMany({
    where: { propertyId },
    select: { wertquote: true },
  })
  const currentTotal = existing.reduce((sum: number, o: { wertquote: number }) => sum + o.wertquote, 0)
  if (currentTotal + parsed.data.wertquote > 100.001) {
    return { success: false, error: `Gesamte Wertquote würde ${(currentTotal + parsed.data.wertquote).toFixed(2)}% ergeben (max. 100%)` }
  }

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) {
    const bcrypt = await import('bcryptjs')
    const tempPassword = Math.random().toString(36).slice(-10)
    user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        phone: parsed.data.phone,
        passwordHash: await bcrypt.hash(tempPassword, 10),
        role: 'EIGENTUEMER',
        companyId: session.user.companyId,
      },
    })
  }

  // Update unit status if assigned
  if (parsed.data.unitId) {
    await prisma.unit.update({
      where: { id: parsed.data.unitId },
      data: { status: 'VERMIETET' },
    })
  }

  await prisma.propertyOwner.create({
    data: {
      userId: user.id,
      propertyId,
      unitId: parsed.data.unitId,
      wertquote: parsed.data.wertquote,
      hypothekarbetrag: parsed.data.hypothekarbetrag,
      hypothekarzins: parsed.data.hypothekarzins,
      bankverbindung: parsed.data.bankverbindung,
      zahlungsIban: parsed.data.zahlungsIban,
    },
  })

  revalidatePath(`/dashboard/weg/${propertyId}`)
  revalidatePath(`/dashboard/weg/${propertyId}/owners`)
  return { success: true, data: null }
}

export async function updateWegOwner(ownerId: string, propertyId: string, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = ownerSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  // Check total wertquote won't exceed 100% (excluding this owner's current quota)
  const existing = await prisma.propertyOwner.findMany({
    where: { propertyId, id: { not: ownerId } },
    select: { wertquote: true },
  })
  const currentTotal = existing.reduce((sum: number, o: { wertquote: number }) => sum + o.wertquote, 0)
  if (currentTotal + parsed.data.wertquote > 100.001) {
    return { success: false, error: `Gesamte Wertquote würde ${(currentTotal + parsed.data.wertquote).toFixed(2)}% ergeben (max. 100%)` }
  }

  const owner = await prisma.propertyOwner.findUnique({ where: { id: ownerId }, include: { user: true } })
  if (!owner) return { success: false, error: 'Eigentümer nicht gefunden' }

  // Update user info
  await prisma.user.update({
    where: { id: owner.userId },
    data: { name: parsed.data.name, phone: parsed.data.phone },
  })

  // Update unit if changed
  if (parsed.data.unitId && parsed.data.unitId !== owner.unitId) {
    if (owner.unitId) {
      await prisma.unit.update({ where: { id: owner.unitId }, data: { status: 'LEER' } })
    }
    await prisma.unit.update({ where: { id: parsed.data.unitId }, data: { status: 'VERMIETET' } })
  }

  await prisma.propertyOwner.update({
    where: { id: ownerId },
    data: {
      unitId: parsed.data.unitId,
      wertquote: parsed.data.wertquote,
      hypothekarbetrag: parsed.data.hypothekarbetrag,
      hypothekarzins: parsed.data.hypothekarzins,
      bankverbindung: parsed.data.bankverbindung,
      zahlungsIban: parsed.data.zahlungsIban,
    },
  })

  revalidatePath(`/dashboard/weg/${propertyId}/owners`)
  return { success: true, data: null }
}

export async function removeWegOwner(ownerId: string, propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const owner = await prisma.propertyOwner.findUnique({ where: { id: ownerId } })
  if (owner?.unitId) {
    await prisma.unit.update({ where: { id: owner.unitId }, data: { status: 'LEER' } })
  }

  await prisma.propertyOwner.delete({ where: { id: ownerId } })
  revalidatePath(`/dashboard/weg/${propertyId}/owners`)
  return { success: true, data: null }
}

// ─── Get owner WEG data (for owner dashboard) ────────────────────────────────
export async function getMyWegData() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const ownerships = await prisma.propertyOwner.findMany({
    where: { userId: session.user.id },
    include: {
      property: {
        include: { wegConfig: true },
      },
      unit: true,
    },
  })
  return ownerships
}
