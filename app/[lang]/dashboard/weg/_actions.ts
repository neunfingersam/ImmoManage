'use server'

import { getServerSession } from 'next-auth'
import { revalidateAllLocales } from '@/lib/revalidate'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { sendTenantInviteEmail } from '@/lib/email'
import { ensureSystemFolders, ensureAssemblyFolder } from '@/lib/document-folders'

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

  await ensureSystemFolders(property.id, session.user.companyId)

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

  revalidateAllLocales('/dashboard/weg')
  return { success: true, data: { id: property.id } }
}

// ─── Update WEG config ────────────────────────────────────────────────────────
const wegConfigSchema = z.object({
  kanton: z.string().optional(),
  gebVersicherungswert: z.number().positive('Gebäudeversicherungswert muss positiv sein').optional(),
  verkehrswert: z.number().positive('Verkehrswert muss positiv sein').optional(),
  fondsBeitragssatz: z.number().min(0).max(10).optional(),
  fondsObergrenze: z.number().min(0).max(50).optional(),
  fondsStand: z.number().min(0).optional(),
})

export async function updateWegConfig(propertyId: string, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = wegConfigSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) return { success: false, error: 'Zugriff verweigert' }

  await prisma.wegConfig.upsert({
    where: { propertyId },
    update: parsed.data,
    create: { propertyId, ...parsed.data },
  })

  revalidateAllLocales(`/dashboard/weg/${propertyId}`)
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
  mea: z.number().int().min(0).max(10000).default(0),
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
  const isNewUser = !user
  if (!user) {
    const bcrypt = await import('bcryptjs')
    const tempPassword = randomBytes(16).toString('hex')
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
      mea: parsed.data.mea,
    },
  })

  // Send invite email for newly created users
  if (isNewUser) {
    const inviteToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)
    await prisma.passwordResetToken.create({ data: { token: inviteToken, userId: user.id, expiresAt } })
    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://immo-manage.ch'
    const inviteUrl = `${baseUrl}/de/auth/reset-password?token=${inviteToken}`
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { name: true },
    })
    await sendTenantInviteEmail({
      tenantEmail: parsed.data.email,
      tenantName: parsed.data.name,
      companyName: company?.name ?? 'ImmoManage',
      inviteUrl,
    })
  }

  revalidateAllLocales(`/dashboard/weg/${propertyId}`)
  revalidateAllLocales(`/dashboard/weg/${propertyId}/owners`)
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
      mea: parsed.data.mea,
    },
  })

  revalidateAllLocales(`/dashboard/weg/${propertyId}/owners`)
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
  revalidateAllLocales(`/dashboard/weg/${propertyId}/owners`)
  return { success: true, data: null }
}

// ─── Renewal Plan Items ────────────────────────────────────────────────────────
const renewalItemSchema = z.object({
  bauteil: z.string().min(1, 'Bauteil erforderlich'),
  restlebensdauer: z.number().int().min(1).max(100).optional(),
  erneuerungskosten: z.number().positive().optional(),
  letzteErneuerung: z.number().int().min(1900).max(2100).optional(),
})

export async function addRenewalItem(propertyId: string, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = renewalItemSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) return { success: false, error: 'Zugriff verweigert' }

  const config = await prisma.wegConfig.findUnique({ where: { propertyId } })
  if (!config) return { success: false, error: 'WEG-Konfiguration nicht gefunden' }

  await prisma.renewalPlanItem.create({
    data: { wegConfigId: config.id, ...parsed.data },
  })

  revalidateAllLocales(`/dashboard/weg/${propertyId}/fonds`)
  return { success: true, data: null }
}

export async function updateRenewalItem(id: string, propertyId: string, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = renewalItemSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) return { success: false, error: 'Zugriff verweigert' }

  await prisma.renewalPlanItem.update({ where: { id }, data: parsed.data })

  revalidateAllLocales(`/dashboard/weg/${propertyId}/fonds`)
  return { success: true, data: null }
}

export async function deleteRenewalItem(id: string, propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) return { success: false, error: 'Zugriff verweigert' }

  await prisma.renewalPlanItem.delete({ where: { id } })

  revalidateAllLocales(`/dashboard/weg/${propertyId}/fonds`)
  return { success: true, data: null }
}

// ─── Fonds-Einstellungen aktualisieren ────────────────────────────────────────
const fondsConfigSchema = z.object({
  fondsStand: z.number().min(0, 'Fondsstand muss >= 0 sein'),
  fondsBeitragssatz: z.number().min(0).max(10),
  fondsObergrenze: z.number().min(0).max(50),
})

export async function updateFondsConfig(propertyId: string, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = fondsConfigSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) return { success: false, error: 'Zugriff verweigert' }

  await prisma.wegConfig.upsert({
    where: { propertyId },
    update: { ...parsed.data, fondsLetzteEinzahlung: new Date() },
    create: { propertyId, ...parsed.data },
  })

  revalidateAllLocales(`/dashboard/weg/${propertyId}/fonds`)
  return { success: true, data: null }
}

// ─── Create Assembly ──────────────────────────────────────────────────────────
const createAssemblySchema = z.object({
  datum: z.string().min(1, 'Datum erforderlich'),
  ort: z.string().optional(),
  einladungsFrist: z.number().int().min(1).max(90).optional(),
})

export async function createAssembly(propertyId: string, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = createAssemblySchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) return { success: false, error: 'Zugriff verweigert' }

  const wegConfig = await prisma.wegConfig.findUnique({ where: { propertyId } })
  if (!wegConfig) return { success: false, error: 'WEG-Konfiguration nicht gefunden' }

  const assembly = await prisma.assembly.create({
    data: {
      wegConfigId: wegConfig.id,
      datum: new Date(parsed.data.datum),
      ort: parsed.data.ort,
      einladungsFrist: parsed.data.einladungsFrist ?? 10,
    },
  })

  const year = new Date(parsed.data.datum).getFullYear()
  await ensureAssemblyFolder(assembly.id, propertyId, session.user.companyId, `GV ${year}`)

  revalidateAllLocales(`/dashboard/weg/${propertyId}`)
  return { success: true, data: { id: assembly.id } }
}

// ─── Cast Assembly Vote (with MEA snapshot) ───────────────────────────────────
const castVoteSchema = z.object({
  agendaItemId: z.string().min(1),
  ownerId: z.string().min(1),
  stimme: z.enum(['JA', 'NEIN', 'ENTHALTUNG']),
})

export async function castAssemblyVote(propertyId: string, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = castVoteSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) return { success: false, error: 'Zugriff verweigert' }

  // Snapshot MEA at time of vote
  const ownerRecord = await prisma.propertyOwner.findFirst({
    where: { id: parsed.data.ownerId },
    select: { mea: true },
  })

  await prisma.assemblyVote.upsert({
    where: {
      agendaItemId_ownerId: {
        agendaItemId: parsed.data.agendaItemId,
        ownerId: parsed.data.ownerId,
      },
    },
    update: {
      stimme: parsed.data.stimme,
      meaGewicht: ownerRecord?.mea ?? 0,
    },
    create: {
      agendaItemId: parsed.data.agendaItemId,
      ownerId: parsed.data.ownerId,
      stimme: parsed.data.stimme,
      meaGewicht: ownerRecord?.mea ?? 0,
    },
  })

  revalidateAllLocales(`/dashboard/weg/${propertyId}`)
  return { success: true, data: null }
}

// ─── Get Assembly Votes with weighted results ─────────────────────────────────
export async function getAgendaItemVotes(agendaItemId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { votes: [], headCount: { JA: 0, NEIN: 0, ENTHALTUNG: 0 }, meaWeight: { JA: 0, NEIN: 0, ENTHALTUNG: 0 } }

  const votes = await prisma.assemblyVote.findMany({
    where: { agendaItemId },
    include: { owner: { include: { user: { select: { name: true } } } } },
  })

  const headCount = { JA: 0, NEIN: 0, ENTHALTUNG: 0 }
  const meaWeight = { JA: 0, NEIN: 0, ENTHALTUNG: 0 }

  for (const v of votes) {
    const s = v.stimme as 'JA' | 'NEIN' | 'ENTHALTUNG'
    headCount[s]++
    meaWeight[s] += v.meaGewicht
  }

  return { votes, headCount, meaWeight }
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
