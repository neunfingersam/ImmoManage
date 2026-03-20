'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireCompanyAccess } from '@/lib/auth-guard'
import { leaseSchema, type LeaseFormValues } from '@/lib/schemas/lease'
import type { ActionResult } from '@/lib/action-result'
import type { Lease } from '@/lib/generated/prisma'

function getLeaseWhere(session: { user: { role: string; id: string; companyId: string | null } }) {
  const base = { companyId: session.user.companyId! }
  if (session.user.role === 'VERMIETER') {
    return {
      ...base,
      unit: { property: { assignments: { some: { userId: session.user.id } } } },
    }
  }
  return base
}

export async function getLeases() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []

  return prisma.lease.findMany({
    where: getLeaseWhere(session),
    include: {
      tenant: { select: { id: true, name: true, email: true } },
      unit: {
        include: {
          property: { select: { id: true, name: true, address: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createLease(data: LeaseFormValues): Promise<ActionResult<Lease>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)

  const parsed = leaseSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: (parsed.error as any).issues?.[0]?.message ?? parsed.error.message }

  const unit = await prisma.unit.findFirst({
    where: {
      id: parsed.data.unitId,
      property: session.user.role === 'VERMIETER'
        ? { companyId: session.user.companyId!, assignments: { some: { userId: session.user.id } } }
        : { companyId: session.user.companyId! },
    },
  })
  if (!unit) return { success: false, error: 'Einheit nicht gefunden' }

  const tenant = await prisma.user.findFirst({
    where: { id: parsed.data.tenantId, companyId: session.user.companyId, role: 'MIETER' },
  })
  if (!tenant) return { success: false, error: 'Mieter nicht gefunden' }

  try {
    const lease = await prisma.lease.create({
      data: {
        unitId: parsed.data.unitId,
        tenantId: parsed.data.tenantId,
        companyId: session.user.companyId,
        startDate: new Date(parsed.data.startDate),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        coldRent: parsed.data.coldRent,
        extraCosts: parsed.data.extraCosts,
        depositPaid: parsed.data.depositPaid ?? false,
        status: 'ACTIVE',
      },
    })
    revalidatePath('/dashboard/leases')
    return { success: true, data: lease }
  } catch (e) {
    return { success: false, error: 'Fehler beim Erstellen des Mietvertrags' }
  }
}

export async function endLease(leaseId: string): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)

  const lease = await prisma.lease.findFirst({
    where: { id: leaseId, ...getLeaseWhere(session) },
  })
  if (!lease) return { success: false, error: 'Mietvertrag nicht gefunden' }

  await prisma.lease.update({
    where: { id: leaseId },
    data: { status: 'ENDED', endDate: lease.endDate ?? new Date() },
  })
  revalidatePath('/dashboard/leases')
  return { success: true, data: undefined }
}
