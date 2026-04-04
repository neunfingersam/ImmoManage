'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireCompanyAccess } from '@/lib/auth-guard'

export async function getUnreadCount() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return 0
  return prisma.notification.count({ where: { userId: session.user.id, read: false } })
}

export async function getNotifications() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return []
  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
}

export async function markAllRead() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.companyId) return
  await requireCompanyAccess(session.user.companyId)
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })
  revalidatePath('/dashboard')
}

export async function markOneRead(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  })
}

export async function createNotification(userId: string, type: string, text: string, link?: string) {
  return prisma.notification.create({
    data: { userId, type, text, link },
  })
}
