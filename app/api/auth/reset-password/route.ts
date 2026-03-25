// app/api/auth/reset-password/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const token = formData.get('token') as string
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!token) redirect('/auth/forgot-password')

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!resetToken) redirect(`/auth/reset-password?token=${token}&error=invalid`)
  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } })
    redirect(`/auth/reset-password?token=${token}&error=expired`)
  }

  if (!password || password.length < 8 || password !== confirm) {
    redirect(`/auth/reset-password?token=${token}&error=invalid`)
  }

  const user = await prisma.user.findUnique({ where: { id: resetToken.userId } })
  if (!user || !user.active) {
    await prisma.passwordResetToken.delete({ where: { token } })
    redirect(`/auth/reset-password?token=${token}&error=invalid`)
  }

  const passwordHash = await hash(password, 12)
  await prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } })
  await prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } })

  redirect(`/auth/reset-password?token=${token}&success=1`)
}
