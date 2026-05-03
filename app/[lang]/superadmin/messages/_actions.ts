'use server'

import { revalidateAllLocales } from '@/lib/revalidate'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/lib/action-result'
import type { Message } from '@/lib/generated/prisma'
import { sendPushToUser } from '@/lib/push'

export async function getSuperAdminThreads() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') return []

  const messages = await prisma.message.findMany({
    where: { OR: [{ fromId: session.user.id }, { toId: session.user.id }] },
    include: {
      from: { select: { id: true, name: true } },
      to: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const seen = new Set<string>()
  const threads: typeof messages = []
  for (const m of messages) {
    const partnerId = m.fromId === session.user.id ? m.toId : m.fromId
    if (!seen.has(partnerId)) {
      seen.add(partnerId)
      threads.push(m)
    }
  }
  return threads
}

export async function getSuperAdminThread(partnerId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') return []

  await prisma.message.updateMany({
    where: { fromId: partnerId, toId: session.user.id, read: false },
    data: { read: true },
  })

  return prisma.message.findMany({
    where: {
      OR: [
        { fromId: session.user.id, toId: partnerId },
        { fromId: partnerId, toId: session.user.id },
      ],
    },
    include: { from: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getSuperAdminPartner(partnerId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') return null
  return prisma.user.findUnique({ where: { id: partnerId }, select: { id: true, name: true, companyId: true } })
}

export async function sendSuperAdminMessage(data: { toId: string; text: string }): Promise<ActionResult<Message>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') return { success: false, error: 'Nicht autorisiert' }

  const text = data.text?.trim()
  if (!text) return { success: false, error: 'Nachricht darf nicht leer sein' }

  // Use partner's companyId (required on Message model)
  const partner = await prisma.user.findUnique({ where: { id: data.toId }, select: { companyId: true } })
  if (!partner?.companyId) return { success: false, error: 'Empfänger hat keine Company' }

  const message = await prisma.message.create({
    data: {
      companyId: partner.companyId,
      fromId: session.user.id,
      toId: data.toId,
      text,
    },
  })

  await prisma.notification.create({
    data: { userId: data.toId, type: 'MESSAGE', text: `Neue Nachricht von ${session.user.name ?? 'Platform-Admin'}`, link: '/dashboard/messages' },
  }).catch(() => {})
  sendPushToUser(data.toId, session.user.name ?? 'Neue Nachricht', text, '/dashboard/messages').catch(() => {})
  revalidateAllLocales('/superadmin/messages')
  return { success: true, data: message }
}
