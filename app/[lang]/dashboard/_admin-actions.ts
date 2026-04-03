'use server'

import crypto from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailButton } from '@/lib/email'

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
    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:600px; margin:0 auto;">
      <tr><td bgcolor="#1e3a5f" align="center" style="background-color:#1e3a5f; padding:20px 24px; border-radius:8px 8px 0 0;">
        <span style="font-size:24px;font-weight:700;color:#E8734A;font-family:Arial,Helvetica,sans-serif;">Immo</span><span style="font-size:24px;font-weight:700;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">Manage</span>
      </td></tr>
      <tr><td bgcolor="#f9fafb" style="background-color:#f9fafb; padding:24px; border-radius:0 0 8px 8px; border:1px solid #e5e7eb; border-top:none;">
        <p style="font-family:Arial,Helvetica,sans-serif; color:#1a1a1a;">Hallo ${user.name ?? user.email},</p>
        <p style="font-family:Arial,Helvetica,sans-serif; color:#374151;">Ihr Administrator hat einen Link zum Setzen Ihres Passworts generiert.</p>
        ${emailButton('Passwort jetzt setzen', resetUrl)}
        <p style="color:#888; font-size:13px; font-family:Arial,Helvetica,sans-serif;">Dieser Link ist 1 Stunde gültig.</p>
      </td></tr>
    </table>
    `
  )

  return { success: true }
}
