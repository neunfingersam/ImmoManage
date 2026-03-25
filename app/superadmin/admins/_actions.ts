'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import type { ActionResult } from '@/lib/action-result'

const adminSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail'),
  password: z.string().min(6, 'Mindestens 6 Zeichen'),
  companyId: z.string().min(1, 'Unternehmen ist erforderlich'),
})

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPER_ADMIN') throw new Error('Nicht autorisiert')
  return session
}

export async function getAdmins() {
  await requireSuperAdmin()
  return prisma.user.findMany({
    where: { role: 'ADMIN' },
    include: { company: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createAdmin(data: {
  name: string
  email: string
  password: string
  companyId: string
}): Promise<ActionResult<{ id: string }>> {
  await requireSuperAdmin()

  const parsed = adminSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return { success: false, error: 'E-Mail bereits vergeben' }

  const company = await prisma.company.findUnique({ where: { id: parsed.data.companyId } })
  if (!company) return { success: false, error: 'Unternehmen nicht gefunden' }

  const passwordHash = await hash(parsed.data.password, 12)
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: 'ADMIN',
      companyId: parsed.data.companyId,
      active: true,
    },
  })

  revalidatePath('/superadmin/admins')
  return { success: true, data: { id: user.id } }
}

export async function toggleAdminActive(userId: string): Promise<ActionResult<void>> {
  await requireSuperAdmin()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { success: false, error: 'Admin nicht gefunden' }
  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } })
  revalidatePath('/superadmin/admins')
  return { success: true, data: undefined }
}
