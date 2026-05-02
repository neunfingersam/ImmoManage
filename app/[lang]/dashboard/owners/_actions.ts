import { revalidateAllLocales } from '@/lib/revalidate'
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { withAuthAction, getAuthSession } from '@/lib/action-utils'
import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { sendTenantInviteEmail } from '@/lib/email'
import type { ActionResult } from '@/lib/action-result'

export async function getOwners() {
  const session = await getAuthSession()
  if (!session) return []

  return prisma.user.findMany({
    where: { companyId: session.user.companyId!, role: 'EIGENTUEMER' },
    include: {
      propertyOwnerships: {
        include: {
          property: { select: { id: true, name: true } },
          unit: { select: { id: true, unitNumber: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function createOwner(data: {
  name: string
  email: string
  propertyId: string
  unitId?: string
}): Promise<ActionResult<{ id: string }>> {
  return withAuthAction(async (session) => {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return { success: false, error: 'E-Mail bereits vergeben' }

    const tempPassword = randomBytes(16).toString('hex')
    const passwordHash = await hash(tempPassword, 12)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        role: 'EIGENTUEMER',
        companyId: session.user.companyId!,
      },
    })

    await prisma.propertyOwner.create({
      data: {
        userId: user.id,
        propertyId: data.propertyId,
        unitId: data.unitId || null,
      },
    })

    // Send invite email
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)
    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    })
    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://immo-manage.ch'
    const inviteUrl = `${baseUrl}/de/auth/reset-password?token=${token}`
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId! },
      select: { name: true },
    })
    await sendTenantInviteEmail({
      tenantEmail: data.email,
      tenantName: data.name,
      companyName: company?.name ?? 'ImmoManage',
      inviteUrl,
    })

    revalidateAllLocales('/dashboard/owners')
    return { success: true, data: { id: user.id } }
  })
}

export async function assignOwnerProperty(data: {
  ownerId: string
  propertyId: string
  unitId?: string
}): Promise<ActionResult<{ id: string }>> {
  return withAuthAction(async (session) => {
    const ownerUser = await prisma.user.findUnique({
      where: { id: data.ownerId },
      select: { companyId: true },
    })
    if (!ownerUser || ownerUser.companyId !== session.user.companyId) {
      return { success: false, error: 'Nicht autorisiert' }
    }

    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { companyId: true },
    })
    if (!property || property.companyId !== session.user.companyId) {
      return { success: false, error: 'Nicht autorisiert' }
    }

    const ownership = await prisma.propertyOwner.create({
      data: {
        userId: data.ownerId,
        propertyId: data.propertyId,
        unitId: data.unitId || null,
      },
    })
    revalidateAllLocales('/dashboard/owners')
    return { success: true, data: { id: ownership.id } }
  })
}

export async function removeOwnerProperty(ownershipId: string): Promise<ActionResult<null>> {
  return withAuthAction(async (session) => {
    const ownership = await prisma.propertyOwner.findUnique({
      where: { id: ownershipId },
      select: { property: { select: { companyId: true } } },
    })
    if (!ownership || ownership.property.companyId !== session.user.companyId) {
      return { success: false, error: 'Nicht autorisiert' }
    }

    await prisma.propertyOwner.delete({ where: { id: ownershipId } })
    revalidateAllLocales('/dashboard/owners')
    return { success: true, data: null }
  })
}
