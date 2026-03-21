'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { messageSchema } from '@/lib/schemas/message'
import type { ActionResult } from '@/lib/action-result'
import type { Message } from '@/lib/generated/prisma'
import { requireCompanyAccess } from '@/lib/auth-guard'

export async function getThreads() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.companyId) return []

  // Alle Nachrichten bei denen der aktuelle User beteiligt ist
  const messages = await prisma.message.findMany({
    where: {
      companyId: session.user.companyId,
      OR: [{ fromId: session.user.id }, { toId: session.user.id }],
    },
    include: {
      from: { select: { id: true, name: true } },
      to: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Dedupliziere zu Threads (pro Gesprächspartner)
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

export async function getThread(partnerId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.companyId) return []

  // Als gelesen markieren
  await prisma.message.updateMany({
    where: { companyId: session.user.companyId, fromId: partnerId, toId: session.user.id, read: false },
    data: { read: true },
  })

  return prisma.message.findMany({
    where: {
      companyId: session.user.companyId,
      OR: [
        { fromId: session.user.id, toId: partnerId },
        { fromId: partnerId, toId: session.user.id },
      ],
    },
    include: {
      from: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getPartner(partnerId: string) {
  return prisma.user.findUnique({ where: { id: partnerId }, select: { id: true, name: true, email: true } })
}

export async function sendMessage(data: { toId: string; text: string }): Promise<ActionResult<Message>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  await requireCompanyAccess(session.user.companyId)

  const parsed = messageSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues?.[0]?.message ?? 'Fehler' }

  const recipient = await prisma.user.findFirst({
    where: { id: parsed.data.toId, companyId: session.user.companyId },
  })
  if (!recipient) return { success: false, error: 'Empfänger nicht gefunden' }

  const message = await prisma.message.create({
    data: {
      companyId: session.user.companyId,
      fromId: session.user.id,
      toId: parsed.data.toId,
      text: parsed.data.text,
      source: 'MANUAL',
    },
  })
  revalidatePath('/dashboard/messages')
  revalidatePath(`/dashboard/messages/${parsed.data.toId}`)
  return { success: true, data: message }
}

export async function getMyTenants() {
  // Für Vermieter: alle aktiven Mieter der Company
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []

  return prisma.user.findMany({
    where: {
      companyId: session.user.companyId,
      role: 'MIETER',
      active: true,
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })
}
