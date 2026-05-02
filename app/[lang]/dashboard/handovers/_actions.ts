import { revalidateAllLocales } from '@/lib/revalidate'
'use server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireCompanyAccess } from '@/lib/auth-guard'
import type { ActionResult } from '@/lib/action-result'
import { z } from 'zod'

const roomSchema = z.object({
  name: z.string().min(1),
  condition: z.enum(['GUT', 'MAENGEL', 'NICHT_GEPRUEFT']),
  notes: z.string().default(''),
})

const handoverSchema = z.object({
  leaseId: z.string().min(1, 'Mietvertrag erforderlich'),
  type: z.enum(['EINZUG', 'AUSZUG']),
  date: z.string().min(1, 'Datum erforderlich'),
  notes: z.string().optional(),
  rooms: z.array(roomSchema).min(1, 'Mindestens ein Raum erforderlich'),
})

export async function getHandovers() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []

  const where =
    session.user.role === 'VERMIETER'
      ? {
          companyId: session.user.companyId,
          lease: {
            unit: {
              property: {
                assignments: { some: { userId: session.user.id } },
              },
            },
          },
        }
      : { companyId: session.user.companyId }

  return prisma.handover.findMany({
    where,
    include: {
      lease: {
        include: {
          tenant: { select: { name: true } },
          unit: { include: { property: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getHandover(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null
  return prisma.handover.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      lease: {
        include: {
          tenant: { select: { id: true, name: true, email: true } },
          unit: { include: { property: { select: { name: true, address: true } } } },
        },
      },
    },
  })
}

export async function createHandover(
  data: z.infer<typeof handoverSchema>
): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)

  const parsed = handoverSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

  const lease = await prisma.lease.findFirst({
    where: { id: parsed.data.leaseId, companyId: session.user.companyId },
  })
  if (!lease) return { success: false, error: 'Mietvertrag nicht gefunden' }

  const handover = await prisma.handover.create({
    data: {
      companyId: session.user.companyId,
      leaseId: parsed.data.leaseId,
      type: parsed.data.type,
      date: new Date(parsed.data.date),
      notes: parsed.data.notes || null,
      rooms: parsed.data.rooms,
      status: 'ENTWURF',
    },
  })
  revalidateAllLocales('/dashboard/handovers')
  return { success: true, data: { id: handover.id } }
}

export async function finalizeHandover(id: string): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)

  await prisma.handover.update({
    where: { id, companyId: session.user.companyId },
    data: { status: 'ABGESCHLOSSEN', signedByVermieter: true },
  })
  revalidateAllLocales('/dashboard/handovers')
  revalidatePath(`/dashboard/handovers/${id}`)
  return { success: true, data: undefined }
}

export async function getLeasesForHandover() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []
  return prisma.lease.findMany({
    where: { companyId: session.user.companyId },
    include: {
      tenant: { select: { name: true } },
      unit: { include: { property: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
