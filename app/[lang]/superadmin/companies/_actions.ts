'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ActionResult } from '@/lib/action-result'
import type { Company, Plan } from '@/lib/generated/prisma'

const companySchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche'),
})

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPER_ADMIN') throw new Error('Nicht autorisiert')
  return session
}

export async function getCompanies() {
  await requireSuperAdmin()
  return prisma.company.findMany({
    include: {
      _count: { select: { users: true, properties: true, tickets: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createCompany(data: { name: string; slug: string }): Promise<ActionResult<Company>> {
  await requireSuperAdmin()
  const parsed = companySchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

  const existing = await prisma.company.findUnique({ where: { slug: parsed.data.slug } })
  if (existing) return { success: false, error: 'Slug bereits vergeben' }

  const company = await prisma.company.create({ data: parsed.data })
  revalidatePath('/superadmin/companies')
  return { success: true, data: company }
}

export async function toggleCompanyActive(companyId: string): Promise<ActionResult<Company>> {
  await requireSuperAdmin()
  const company = await prisma.company.findUnique({ where: { id: companyId } })
  if (!company) return { success: false, error: 'Company nicht gefunden' }
  const updated = await prisma.company.update({
    where: { id: companyId },
    data: { active: !company.active },
  })
  revalidatePath('/superadmin/companies')
  return { success: true, data: updated }
}

export async function updateCompanyPlan(companyId: string, plan: Plan): Promise<ActionResult<Company>> {
  await requireSuperAdmin()
  const validPlans: Plan[] = ['STARTER', 'STANDARD', 'PRO', 'ENTERPRISE']
  if (!validPlans.includes(plan)) return { success: false, error: 'Ungültiger Plan' }

  const company = await prisma.company.findUnique({ where: { id: companyId } })
  if (!company) return { success: false, error: 'Company nicht gefunden' }

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: { plan },
  })
  revalidatePath(`/superadmin/companies/${companyId}`)
  revalidatePath('/superadmin/companies')
  return { success: true, data: updated }
}

export async function getCompany(id: string) {
  await requireSuperAdmin()
  return prisma.company.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } },
      _count: { select: { properties: true, tickets: true, leases: true } },
    },
  })
}
