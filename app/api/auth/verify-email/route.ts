// app/api/auth/verify-email/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    redirect('/de/auth/login?verifyError=invalid')
  }

  const record = await prisma.emailVerificationToken.findUnique({ where: { token } })

  if (!record) {
    redirect('/de/auth/login?verifyError=invalid')
  }

  if (record.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { token } })
    redirect('/de/auth/login?verifyError=expired')
  }

  // Mark user as verified and delete token
  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: true },
  })
  await prisma.emailVerificationToken.delete({ where: { token } })

  redirect('/de/auth/login?verified=1')
}
