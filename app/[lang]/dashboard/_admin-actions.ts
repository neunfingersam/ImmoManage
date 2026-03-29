'use server'

import crypto from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function sendPasswordResetLink(userId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId || !['ADMIN', 'VERMIETER'].includes(session.user.role)) {
    return { success: false, error: 'Nicht autorisiert' }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, companyId: true },
  })

  if (!user || user.companyId !== session.user.companyId) {
    return { success: false, error: 'Benutzer nicht gefunden' }
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 Stunde

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/auth/reset-password?token=${token}`

  await sendEmail(
    user.email,
    'Passwort setzen — ImmoManage',
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a5f; padding: 20px 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <span style="font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: #E8734A;">Immo</span><span style="font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Manage</span>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
      <p>Hallo ${user.name ?? user.email},</p>
      <p>Ihr Administrator hat einen Link zum Setzen Ihres Passworts generiert.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #E8734A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Passwort jetzt setzen
        </a>
      </p>
      <p style="color: #888; font-size: 13px;">Dieser Link ist 1 Stunde gültig.</p>
      </div>
    </div>
    `
  )

  return { success: true }
}
