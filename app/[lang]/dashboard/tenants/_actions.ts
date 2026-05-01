'use server'

import { revalidatePath } from 'next/cache'
import { hash } from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getAuthSession, withAuthAction } from '@/lib/action-utils'
import { getTenantWhere, getPropertyWhere } from '@/lib/access-control'
import { tenantSchema, type TenantFormValues, updateTenantSchema, type UpdateTenantValues } from '@/lib/schemas/tenant'
import type { ActionResult } from '@/lib/action-result'
import type { User } from '@/lib/generated/prisma'
import { sendTenantInviteEmail } from '@/lib/email'

const PAGE_SIZE = 20

export async function getTenants(page = 1, search = '') {
  const session = await getAuthSession()
  if (!session) return { tenants: [], total: 0 }

  const skip = (page - 1) * PAGE_SIZE

  const searchFilter = search.trim()
    ? {
        OR: [
          { name: { contains: search.trim() } },
          { email: { contains: search.trim() } },
          { phone: { contains: search.trim() } },
        ],
      }
    : {}

  const where = { ...getTenantWhere(session), ...searchFilter }

  const [tenants, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { name: 'asc' }, skip, take: PAGE_SIZE }),
    prisma.user.count({ where }),
  ])

  return { tenants, total }
}

export async function createTenant(data: TenantFormValues): Promise<ActionResult<User>> {
  return withAuthAction(async (session) => {
    const parsed = tenantSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: (parsed.error as any).issues?.[0]?.message ?? parsed.error.message }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (existing) return { success: false, error: 'E-Mail-Adresse bereits vergeben' }

    try {
      // Random placeholder password — tenant will set their own via invite link
      const passwordHash = await hash(crypto.randomBytes(32).toString('hex'), 12)
      const tenant = await prisma.user.create({
        data: {
          email: parsed.data.email,
          passwordHash,
          name: parsed.data.name,
          phone: parsed.data.phone ?? null,
          role: 'MIETER',
          companyId: session.user.companyId,
          active: true,
        },
      })

      // Generate invite token (reuse PasswordResetToken, expires in 72h)
      await prisma.passwordResetToken.deleteMany({ where: { userId: tenant.id } })
      const token = crypto.randomBytes(32).toString('hex')
      await prisma.passwordResetToken.create({
        data: { token, userId: tenant.id, expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) },
      })

      const company = await prisma.company.findUnique({ where: { id: session.user.companyId }, select: { name: true } })
      const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
      const inviteUrl = `${baseUrl}/auth/reset-password?token=${token}`

      await sendTenantInviteEmail({
        tenantEmail: tenant.email,
        tenantName: tenant.name,
        companyName: company?.name ?? 'ImmoManage',
        inviteUrl,
        expiresHours: 72,
      }).catch(() => {})

      revalidatePath('/dashboard/tenants')
      return { success: true, data: tenant }
    } catch (e) {
      return { success: false, error: 'Fehler beim Erstellen des Mieters' }
    }
  })
}

export async function resendTenantInvite(tenantId: string): Promise<ActionResult<void>> {
  return withAuthAction(async (session) => {
    const tenant = await prisma.user.findFirst({
      where: { id: tenantId, companyId: session.user.companyId, role: 'MIETER' },
    })
    if (!tenant) return { success: false, error: 'Mieter nicht gefunden' }

    await prisma.passwordResetToken.deleteMany({ where: { userId: tenantId } })
    const token = crypto.randomBytes(32).toString('hex')
    await prisma.passwordResetToken.create({
      data: { token, userId: tenantId, expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) },
    })

    const company = await prisma.company.findUnique({ where: { id: session.user.companyId }, select: { name: true } })
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/auth/reset-password?token=${token}`

    await sendTenantInviteEmail({
      tenantEmail: tenant.email,
      tenantName: tenant.name,
      companyName: company?.name ?? 'ImmoManage',
      inviteUrl,
      expiresHours: 72,
    })

    return { success: true, data: undefined }
  })
}

export async function deactivateTenant(tenantId: string): Promise<ActionResult<void>> {
  return withAuthAction(async (session) => {
    const tenant = await prisma.user.findFirst({
      where: { id: tenantId, ...getTenantWhere(session) },
    })
    if (!tenant) return { success: false, error: 'Mieter nicht gefunden' }

    await prisma.user.update({
      where: { id: tenantId },
      data: { active: false },
    })
    revalidatePath('/dashboard/tenants')
    return { success: true, data: undefined }
  })
}

export async function getTenant(tenantId: string) {
  const session = await getAuthSession()
  if (!session) return null
  return prisma.user.findFirst({
    where: { id: tenantId, ...getTenantWhere(session) },
  })
}

export async function updateTenant(tenantId: string, data: UpdateTenantValues): Promise<ActionResult<void>> {
  return withAuthAction(async (session) => {
    const parsed = updateTenantSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

    const tenant = await prisma.user.findFirst({
      where: { id: tenantId, ...getTenantWhere(session) },
    })
    if (!tenant) return { success: false, error: 'Mieter nicht gefunden' }

    if (parsed.data.email !== tenant.email) {
      const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
      if (existing) return { success: false, error: 'E-Mail bereits vergeben' }
    }

    await prisma.user.update({
      where: { id: tenantId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        whatsapp: parsed.data.whatsapp ?? null,
      },
    })
    revalidatePath('/dashboard/tenants')
    revalidatePath(`/dashboard/tenants/${tenantId}`)
    return { success: true, data: undefined }
  })
}

export async function getUnitsForMove(tenantId: string) {
  const session = await getAuthSession()
  if (!session) return []

  const properties = await prisma.property.findMany({
    where: getPropertyWhere(session),
    include: {
      units: {
        include: { leases: { where: { status: 'ACTIVE' }, select: { id: true } } },
      },
    },
    orderBy: { name: 'asc' },
  })

  return properties
    .map(p => ({
      propertyId: p.id,
      propertyName: p.name,
      units: p.units
        .filter(u => u.leases.length === 0)
        .map(u => ({ unitId: u.id, unitNumber: u.unitNumber, floor: u.floor })),
    }))
    .filter(p => p.units.length > 0)
}

export async function moveTenantToUnit(tenantId: string, newUnitId: string): Promise<ActionResult<void>> {
  return withAuthAction(async (session) => {
    const tenant = await prisma.user.findFirst({
      where: { id: tenantId, ...getTenantWhere(session) },
    })
    if (!tenant) return { success: false, error: 'Mieter nicht gefunden' }

    const currentLease = await prisma.lease.findFirst({
      where: { tenantId, status: 'ACTIVE' },
    })
    if (!currentLease) return { success: false, error: 'Kein aktiver Mietvertrag gefunden' }

    const newUnit = await prisma.unit.findFirst({
      where: { id: newUnitId, property: getPropertyWhere(session) },
    })
    if (!newUnit) return { success: false, error: 'Einheit nicht gefunden oder kein Zugriff' }

    const activeLease = await prisma.lease.count({ where: { unitId: newUnitId, status: 'ACTIVE' } })
    if (activeLease > 0) return { success: false, error: 'Einheit ist bereits belegt' }

    // Atomare Transaktion: alter Lease endet, neuer wird erstellt
    await prisma.$transaction([
      prisma.lease.update({
        where: { id: currentLease.id },
        data: { status: 'ENDED', endDate: new Date() },
      }),
      prisma.lease.create({
        data: {
          unitId: newUnitId,
          tenantId,
          companyId: session.user.companyId,
          startDate: new Date(),
          coldRent: currentLease.coldRent,
          extraCosts: currentLease.extraCosts,
          depositPaid: currentLease.depositPaid,
          status: 'ACTIVE',
        },
      }),
    ])

    revalidatePath('/dashboard/tenants')
    revalidatePath(`/dashboard/tenants/${tenantId}`)
    revalidatePath('/dashboard/leases')
    return { success: true, data: undefined }
  })
}

export async function reactivateTenant(tenantId: string): Promise<ActionResult<void>> {
  return withAuthAction(async (session) => {
    const tenant = await prisma.user.findFirst({
      where: { id: tenantId, ...getTenantWhere(session) },
    })
    if (!tenant) return { success: false, error: 'Mieter nicht gefunden' }

    await prisma.user.update({
      where: { id: tenantId },
      data: { active: true },
    })
    revalidatePath('/dashboard/tenants')
    return { success: true, data: undefined }
  })
}
