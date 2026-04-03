// app/api/auth/forgot-password/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailButton } from '@/lib/email'
import { checkRateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'
import { redirect } from 'next/navigation'

export async function POST(req: NextRequest) {
  // Rate-limit: max 5 reset requests per IP per 15 minutes
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const rl = await checkRateLimit(`forgot-pw:${ip}`)
  if (!rl.allowed) {
    redirect('/auth/forgot-password?sent=1') // same redirect — don't reveal rate limit
  }

  const formData = await req.formData()
  const email = (formData.get('email') as string)?.toLowerCase().trim()

  if (email) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      // Alte Tokens löschen
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 Stunde

      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      })

      const resetUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/auth/reset-password?token=${token}`
      await sendEmail(
        user.email,
        'Passwort zurücksetzen — ImmoManage',
        `
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto;">
          <tr><td bgcolor="#1e3a5f" align="center" style="background-color:#1e3a5f; padding:20px 24px; border-radius:8px 8px 0 0;">
            <span style="font-size:24px;font-weight:700;color:#E8734A;font-family:Arial,Helvetica,sans-serif;">Immo</span><span style="font-size:24px;font-weight:700;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">Manage</span>
          </td></tr>
          <tr><td bgcolor="#f9fafb" style="background-color:#f9fafb; padding:24px; border-radius:0 0 8px 8px; border:1px solid #e5e7eb; border-top:none;">
            <p style="font-family:Arial,Helvetica,sans-serif; color:#1a1a1a;">Hallo ${user.name},</p>
            <p style="font-family:Arial,Helvetica,sans-serif; color:#374151;">du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
            ${emailButton('Passwort zurücksetzen', resetUrl)}
            <p style="color:#888; font-size:13px; font-family:Arial,Helvetica,sans-serif;">Dieser Link ist 1 Stunde gültig. Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail.</p>
          </td></tr>
        </table>
        `
      ).catch(() => {})
    }
  }

  redirect('/auth/forgot-password?sent=1')
}
