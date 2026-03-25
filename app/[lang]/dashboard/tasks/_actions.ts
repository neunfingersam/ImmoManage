'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const taskSchema = z.object({
  title: z.string().min(1, 'Titel erforderlich'),
  description: z.string().optional(),
  type: z.enum(['WARTUNG', 'REPARATUR', 'VERTRAGSVERLAENGERUNG', 'BESICHTIGUNG', 'SONSTIGES']),
  dueDate: z.string().datetime(),
  propertyId: z.string().optional(),
  tenantId: z.string().optional(),
  reminderDays: z.number().int().min(0).optional(),
})

export async function createTaskAction(data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  const parsed = taskSchema.parse(data)

  await prisma.task.create({
    data: {
      companyId: session.user.companyId,
      createdById: session.user.id,
      title: parsed.title,
      description: parsed.description,
      type: parsed.type,
      dueDate: new Date(parsed.dueDate),
      status: 'OFFEN',
      propertyId: parsed.propertyId || undefined,
      tenantId: parsed.tenantId || undefined,
      reminderDays: parsed.reminderDays,
    },
  })

  revalidatePath('/dashboard/tasks')
}

export async function updateTaskStatusAction(taskId: string, status: 'OFFEN' | 'IN_BEARBEITUNG' | 'ERLEDIGT') {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  await prisma.task.update({
    where: { id: taskId, companyId: session.user.companyId },
    data: { status },
  })

  revalidatePath('/dashboard/tasks')
}

export async function deleteTaskAction(taskId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  await prisma.task.delete({
    where: { id: taskId, companyId: session.user.companyId },
  })

  revalidatePath('/dashboard/tasks')
}
