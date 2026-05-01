'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'
import type { ActionResult } from '@/lib/action-result'

const adminSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail'),
  companyId: z.string().min(1, 'Unternehmen ist erforderlich'),
})

function generatePassword(length = 12): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

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
  companyId: string
}): Promise<ActionResult<{ id: string }>> {
  await requireSuperAdmin()

  const parsed = adminSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return { success: false, error: 'E-Mail bereits vergeben' }

  const company = await prisma.company.findUnique({ where: { id: parsed.data.companyId } })
  if (!company) return { success: false, error: 'Unternehmen nicht gefunden' }

  const tempPassword = generatePassword()
  const passwordHash = await hash(tempPassword, 12)
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

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a5f; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 18px;">Ihr ImmoManage-Zugang</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hallo ${parsed.data.name},</p>
        <p>Ihr Administrator-Konto bei ImmoManage wurde eingerichtet. Hier sind Ihre Zugangsdaten:</p>
        <p><strong>E-Mail:</strong> ${parsed.data.email}</p>
        <p><strong>Temporäres Passwort:</strong> <code style="background:#e5e7eb;padding:2px 6px;border-radius:4px;">${tempPassword}</code></p>
        <p>Bitte melden Sie sich an und ändern Sie Ihr Passwort umgehend in Ihrem Profil.</p>
        <p><a href="https://immo-manage.ch/de/auth/login" style="color:#1e3a5f;">Zum Login</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af;">ImmoManage · ${company.name}</p>
      </div>
    </div>
  `

  await sendEmail(parsed.data.email, 'Ihr ImmoManage-Zugang', html)

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
