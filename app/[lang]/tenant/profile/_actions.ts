'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateProfileSchema, type UpdateProfileValues } from '@/lib/schemas/tenant'
import type { ActionResult } from '@/lib/action-result'

export async function updateProfile(data: UpdateProfileValues): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'MIETER') {
    return { success: false, error: 'Nicht autorisiert' }
  }

  const parsed = updateProfileSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

  if (parsed.data.email !== session.user.email) {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (existing) return { success: false, error: 'E-Mail bereits vergeben' }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      whatsapp: parsed.data.whatsapp ?? null,
    },
  })
  revalidatePath('/tenant/profile')
  return { success: true, data: undefined }
}
