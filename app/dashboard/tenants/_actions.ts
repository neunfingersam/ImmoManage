'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { hash } from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireCompanyAccess } from '@/lib/auth-guard'
import { tenantSchema, type TenantFormValues } from '@/lib/schemas/tenant'
import type { ActionResult } from '@/lib/action-result'
import type { User } from '@/lib/generated/prisma'

export async function getTenants() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []

  if (session.user.role === 'VERMIETER') {
    return prisma.user.findMany({
      where: {
        role: 'MIETER',
        companyId: session.user.companyId,
        leases: {
          some: {
            status: 'ACTIVE',
            unit: {
              property: {
                assignments: { some: { userId: session.user.id } },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  return prisma.user.findMany({
    where: { role: 'MIETER', companyId: session.user.companyId },
    orderBy: { name: 'asc' },
  })
}

export async function createTenant(data: TenantFormValues): Promise<ActionResult<User>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)

  const parsed = tenantSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: (parsed.error as any).issues?.[0]?.message ?? parsed.error.message }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return { success: false, error: 'E-Mail-Adresse bereits vergeben' }

  try {
    const passwordHash = await hash(parsed.data.password, 12)
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
    revalidatePath('/dashboard/tenants')
    return { success: true, data: tenant }
  } catch (e) {
    return { success: false, error: 'Fehler beim Erstellen des Mieters' }
  }
}

export async function deactivateTenant(tenantId: string): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)

  await prisma.user.update({
    where: { id: tenantId, companyId: session.user.companyId, role: 'MIETER' },
    data: { active: false },
  })
  revalidatePath('/dashboard/tenants')
  return { success: true, data: undefined }
}
