'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { withAuthAction, getAuthSession } from '@/lib/action-utils'
import { randomBytes } from 'crypto'
import {
  sendDeletionRequestEmail,
  sendDeletionApprovedEmail,
  sendDeletionRejectedEmail,
} from '@/lib/email'
import type { ActionResult } from '@/lib/action-result'

// User requests deletion of their own account
export async function requestAccountDeletion(): Promise<ActionResult<null>> {
  return withAuthAction(async (session) => {
    const userId = session.user.id

    // Check for active lease
    const activeLease = await prisma.lease.findFirst({
      where: { tenantId: userId, status: 'ACTIVE' },
    })
    if (activeLease) {
      return { success: false, error: 'active_lease' }
    }

    // Check for active Stripe subscription (admin accounts)
    const userCompany = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        company: {
          select: { planStatus: true, stripeSubscriptionId: true },
        },
      },
    })
    const co = userCompany?.company
    if (
      co?.stripeSubscriptionId &&
      (co.planStatus === 'ACTIVE' || co.planStatus === 'TRIAL')
    ) {
      return { success: false, error: 'active_subscription' }
    }

    // Check if request already exists
    const existing = await prisma.accountDeletionRequest.findUnique({
      where: { userId },
    })
    if (existing) {
      return { success: false, error: 'already_requested' }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, companyId: true, role: true },
    })
    if (!user?.companyId) return { success: false, error: 'no_company' }

    await prisma.accountDeletionRequest.create({
      data: { userId, companyId: user.companyId },
    })

    // If requester is ADMIN → notify SUPER_ADMIN; otherwise notify company admin
    if (user.role === 'ADMIN') {
      const superAdmin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN', active: true },
        select: { name: true, email: true },
      })
      if (superAdmin) {
        await sendDeletionRequestEmail({
          adminEmail: superAdmin.email,
          adminName: superAdmin.name,
          userName: user.name,
          userEmail: user.email,
          approveUrl: '',
          rejectUrl: '',
        })
      }
    } else {
      const admin = await prisma.user.findFirst({
        where: {
          companyId: user.companyId,
          role: { in: ['ADMIN', 'VERMIETER'] },
          active: true,
        },
        select: { name: true, email: true },
      })
      if (admin) {
        await sendDeletionRequestEmail({
          adminEmail: admin.email,
          adminName: admin.name,
          userName: user.name,
          userEmail: user.email,
          approveUrl: '',
          rejectUrl: '',
        })
      }
    }

    return { success: true, data: null }
  })
}

// Admin approves deletion → anonymise the account
export async function approveAccountDeletion(
  requestId: string
): Promise<ActionResult<null>> {
  return withAuthAction(async (session) => {
    const sessionRole = session.user.role
    if (sessionRole !== 'ADMIN' && sessionRole !== 'VERMIETER' && sessionRole !== 'SUPER_ADMIN') {
      return { success: false, error: 'forbidden' }
    }

    const request = await prisma.accountDeletionRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { name: true, email: true, role: true, companyId: true } } },
    })
    if (!request) return { success: false, error: 'not_found' }
    if (request.status !== 'PENDING') {
      return { success: false, error: 'already_resolved' }
    }

    const { name, email, role, companyId } = request.user

    // Anonymise: replace PII
    await prisma.user.update({
      where: { id: request.userId },
      data: {
        name: 'Gelöschter Nutzer',
        email: `deleted-${request.userId}@immo-manage.invalid`,
        passwordHash: randomBytes(32).toString('hex'),
        phone: null,
        whatsapp: null,
        iban: null,
        active: false,
      },
    })

    // If the deleted user was the company ADMIN, deactivate the entire company
    if (role === 'ADMIN' && companyId) {
      await prisma.company.update({
        where: { id: companyId },
        data: { active: false },
      })
    }

    await prisma.accountDeletionRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', resolvedAt: new Date() },
    })

    try {
      await sendDeletionApprovedEmail({ userEmail: email, userName: name })
    } catch {
      // email failure should not block the action
    }

    revalidatePath('/dashboard/deletion-requests')
    return { success: true, data: null }
  })
}

// Admin rejects deletion
export async function rejectAccountDeletion(
  requestId: string,
  reason?: string
): Promise<ActionResult<null>> {
  return withAuthAction(async (session) => {
    const role = session.user.role
    if (role !== 'ADMIN' && role !== 'VERMIETER' && role !== 'SUPER_ADMIN') {
      return { success: false, error: 'forbidden' }
    }

    const request = await prisma.accountDeletionRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { name: true, email: true } } },
    })
    if (!request) return { success: false, error: 'not_found' }
    if (request.status !== 'PENDING') {
      return { success: false, error: 'already_resolved' }
    }

    await prisma.accountDeletionRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', resolvedAt: new Date(), reason: reason ?? null },
    })

    try {
      await sendDeletionRejectedEmail({
        userEmail: request.user.email,
        userName: request.user.name,
        reason,
      })
    } catch {
      // email failure should not block the action
    }

    revalidatePath('/dashboard/deletion-requests')
    return { success: true, data: null }
  })
}

// Get deletion request status for current user
export async function getMyDeletionRequest() {
  const session = await getAuthSession()
  if (!session) return null
  return prisma.accountDeletionRequest.findUnique({
    where: { userId: session.user.id },
  })
}

// Get all pending deletion requests for admin/superadmin
export async function getDeletionRequests() {
  const session = await getAuthSession()
  if (!session) return []
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  return prisma.accountDeletionRequest.findMany({
    where: {
      status: 'PENDING',
      ...(isSuperAdmin ? {} : { companyId: session.user.companyId! }),
    },
    include: { user: { select: { id: true, name: true, email: true, role: true, createdAt: true } } },
    orderBy: { createdAt: 'asc' },
  })
}
