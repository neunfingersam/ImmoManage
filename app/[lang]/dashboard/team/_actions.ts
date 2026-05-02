'use server'
import { revalidateAllLocales } from '@/lib/revalidate'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import type { ActionResult } from '@/lib/action-result'
import type { User } from '@/lib/generated/prisma'
import { requireCompanyAccess } from '@/lib/auth-guard'
import { getPlanLimits } from '@/lib/plan-limits'

const createVermieterSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail'),
  password: z.string().min(6, 'Mindestens 6 Zeichen'),
  phone: z.string().optional(),
})

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId || session.user.role !== 'ADMIN') {
    throw new Error('Nur Admins erlaubt')
  }
  return session
}

export async function getTeamMembers() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []
  return prisma.user.findMany({
    where: { companyId: session.user.companyId, role: { in: ['VERMIETER', 'ADMIN'] } },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, phone: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createVermieter(data: { name: string; email: string; password: string; phone?: string }): Promise<ActionResult<User>> {
  const session = await requireAdmin()
  await requireCompanyAccess(session.user.companyId!)
  const parsed = createVermieterSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

  // Plan limit check
  const company = await prisma.company.findUnique({ where: { id: session.user.companyId! } })
  if (!company) return { success: false, error: 'Company nicht gefunden' }
  const limits = getPlanLimits(company.plan)
  if (limits.maxUsers !== null) {
    const count = await prisma.user.count({
      where: { companyId: session.user.companyId!, role: { in: ['ADMIN', 'VERMIETER'] } },
    })
    if (count >= limits.maxUsers) {
      return { success: false, error: `Ihr ${limits.label}-Plan erlaubt max. ${limits.maxUsers} Benutzer. Bitte upgraden Sie Ihren Plan.` }
    }
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return { success: false, error: 'E-Mail bereits registriert' }

  const passwordHash = await hash(parsed.data.password, 12)
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: 'VERMIETER',
      companyId: session.user.companyId!,
      phone: parsed.data.phone ?? null,
    },
  })
  revalidateAllLocales('/dashboard/team')
  return { success: true, data: user }
}

export async function toggleUserActive(userId: string): Promise<ActionResult<User>> {
  const session = await requireAdmin()
  await requireCompanyAccess(session.user.companyId!)
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId: session.user.companyId! },
  })
  if (!user) return { success: false, error: 'Nutzer nicht gefunden' }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  })
  revalidateAllLocales('/dashboard/team')
  return { success: true, data: updated }
}
