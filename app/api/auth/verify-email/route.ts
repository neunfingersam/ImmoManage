// app/api/auth/verify-email/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

const locale = routing.defaultLocale

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    redirect(`/${locale}/auth/login?verifyError=invalid`)
  }

  const record = await prisma.emailVerificationToken.findUnique({ where: { token } })

  if (!record) {
    redirect(`/${locale}/auth/login?verifyError=invalid`)
  }

  if (record.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { token } })
    redirect(`/${locale}/auth/login?verifyError=expired`)
  }

  // Mark user as verified and delete token
  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: true },
  })
  await prisma.emailVerificationToken.delete({ where: { token } })

  redirect(`/${locale}/auth/login?verified=1`)
}
