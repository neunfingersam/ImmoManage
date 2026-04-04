'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/lib/action-result'
import type { Message } from '@/lib/generated/prisma'
import { sendPushToUser } from '@/lib/push'

export async function getMyMessages() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return []

  return prisma.message.findMany({
    where: { OR: [{ fromId: session.user.id }, { toId: session.user.id }] },
    include: {
      from: { select: { id: true, name: true } },
      to: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getMyVermieter() {
  // Vermieter des Mieters via aktive Leases + PropertyAssignment
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.companyId) return null

  const lease = await prisma.lease.findFirst({
    where: { tenantId: session.user.id, status: 'ACTIVE' },
    include: {
      unit: {
        include: {
          property: {
            include: {
              assignments: {
                include: { user: { select: { id: true, name: true } } },
              },
            },
          },
        },
      },
    },
  })

  const assignment = lease?.unit?.property?.assignments?.[0]
  if (assignment) return assignment.user

  // Fallback: Admin der Company
  return prisma.user.findFirst({
    where: { companyId: session.user.companyId, role: 'ADMIN' },
    select: { id: true, name: true },
  })
}

export async function sendTenantMessage(data: { toId: string; text: string }): Promise<ActionResult<Message>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  if (!data.text.trim()) return { success: false, error: 'Nachricht darf nicht leer sein' }

  const message = await prisma.message.create({
    data: {
      companyId: session.user.companyId,
      fromId: session.user.id,
      toId: data.toId,
      text: data.text,
      source: 'MANUAL',
    },
  })
  await prisma.notification.create({
    data: { userId: data.toId, type: 'MESSAGE', text: `Neue Nachricht von ${session.user.name ?? 'Mieter'}`, link: '/dashboard/messages' },
  }).catch(() => {})
  sendPushToUser(data.toId, session.user.name ?? 'Neue Nachricht', data.text.trim(), '/dashboard/messages').catch(() => {})
  revalidatePath('/tenant/messages')
  return { success: true, data: message }
}
