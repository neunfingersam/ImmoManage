'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash, compare } from 'bcryptjs'
import type { ActionResult } from '@/lib/action-result'

export async function changePasswordAction(data: {
  currentPassword: string
  newPassword: string
}): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Nicht angemeldet' }

  if (data.newPassword.length < 8) {
    return { success: false, error: 'Neues Passwort muss mindestens 8 Zeichen haben' }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  })
  if (!user) return { success: false, error: 'Benutzer nicht gefunden' }

  const valid = await compare(data.currentPassword, user.passwordHash)
  if (!valid) return { success: false, error: 'Aktuelles Passwort ist falsch' }

  const newHash = await hash(data.newPassword, 12)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash, mustChangePassword: false },
  })

  return { success: true, data: undefined }
}
