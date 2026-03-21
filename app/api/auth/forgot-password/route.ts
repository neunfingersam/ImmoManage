// app/api/auth/forgot-password/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'
import { redirect } from 'next/navigation'

export async function POST(req: NextRequest) {
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
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E8734A;">Passwort zurücksetzen</h2>
          <p>Hallo ${user.name},</p>
          <p>du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background: #E8734A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
              Passwort zurücksetzen
            </a>
          </p>
          <p style="color: #888; font-size: 13px;">Dieser Link ist 1 Stunde gültig. Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail.</p>
        </div>
        `
      ).catch(() => {})
    }
  }

  redirect('/auth/forgot-password?sent=1')
}
