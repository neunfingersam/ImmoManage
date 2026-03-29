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
      <h2 style="color: #E8734A;">Passwort setzen</h2>
      <p>Hallo ${user.name ?? user.email},</p>
      <p>Ihr Administrator hat einen Link zum Setzen Ihres Passworts generiert.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #E8734A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Passwort jetzt setzen
        </a>
      </p>
      <p style="color: #888; font-size: 13px;">Dieser Link ist 1 Stunde gültig.</p>
    </div>
    `
  )

  return { success: true }
}
