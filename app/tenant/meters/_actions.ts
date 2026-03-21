'use server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-result'
import { z } from 'zod'

const meterSchema = z.object({
  type: z.enum(['STROM', 'GAS', 'WASSER', 'HEIZUNG']),
  value: z.number().positive('Wert muss positiv sein'),
  readingDate: z.string().min(1, 'Datum erforderlich'),
  note: z.string().optional(),
})

export async function getMyReadings() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return []
  return prisma.meterReading.findMany({
    where: { tenantId: session.user.id },
    orderBy: { readingDate: 'desc' },
  })
}

export async function submitMeterReading(data: {
  type: string; value: number; readingDate: string; note?: string
}): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = meterSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

  const lease = await prisma.lease.findFirst({
    where: { tenantId: session.user.id, status: 'ACTIVE' },
  })
  if (!lease) return { success: false, error: 'Kein aktiver Mietvertrag gefunden' }

  await prisma.meterReading.create({
    data: {
      companyId: session.user.companyId,
      leaseId: lease.id,
      tenantId: session.user.id,
      type: parsed.data.type as any,
      value: parsed.data.value,
      unit: parsed.data.type === 'WASSER' ? 'm³' : 'kWh',
      readingDate: new Date(parsed.data.readingDate),
      note: parsed.data.note || null,
    },
  })
  revalidatePath('/tenant/meters')
  return { success: true, data: undefined }
}
