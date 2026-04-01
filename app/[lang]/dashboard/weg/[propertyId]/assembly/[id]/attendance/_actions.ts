'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import type { ActionResult } from '@/lib/action-result'

export async function getAssemblyWithAttendance(assemblyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  return prisma.assembly.findFirst({
    where: { id: assemblyId },
    include: {
      wegConfig: {
        include: {
          property: {
            include: {
              owners: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
          },
        },
      },
      attendance: {
        include: {
          owner: { include: { user: { select: { id: true, name: true } } } },
          vertreter: { include: { user: { select: { id: true, name: true } } } },
        },
      },
      agenda: { orderBy: { position: 'asc' } },
    },
  })
}

export async function sendAssemblyInvitation(assemblyId: string): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const assembly = await getAssemblyWithAttendance(assemblyId)
  if (!assembly) return { success: false, error: 'Versammlung nicht gefunden' }

  const property = assembly.wegConfig.property

  const datum = new Date(assembly.datum).toLocaleDateString('de-CH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const uhrzeit = new Date(assembly.datum).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })

  for (const owner of property.owners) {
    if (!owner.user.email) continue
    const vollmachtLine = assembly.vollmachtFrist
      ? `<p>Vollmachten bitte bis ${new Date(assembly.vollmachtFrist).toLocaleDateString('de-CH')} einreichen.</p>`
      : ''
    const html = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Sehr geehrte/r ${owner.user.name},</p>
      <p>Sie sind herzlich zur Eigentümerversammlung eingeladen:</p>
      <p><strong>Datum:</strong> ${datum}<br/>
      <strong>Zeit:</strong> ${uhrzeit} Uhr<br/>
      <strong>Ort:</strong> ${assembly.ort ?? 'wird noch bekannt gegeben'}</p>
      <p><strong>Liegenschaft:</strong> ${property.name}</p>
      ${vollmachtLine}
      <p>Mit freundlichen Grüssen<br/>${session.user.name ?? 'Verwaltung'}</p>
    </div>`
    await sendEmail(
      owner.user.email,
      `Einladung zur Eigentümerversammlung — ${property.name}`,
      html,
    )
  }

  await prisma.assembly.update({ where: { id: assemblyId }, data: { einladungVersandtAt: new Date() } })
  revalidatePath(`/dashboard/weg/${property.id}`)
  return { success: true, data: null }
}

export async function saveAttendance(
  assemblyId: string,
  ownerId: string,
  data: { anwesend: boolean; vertretenDurch?: string | null },
): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  await prisma.assemblyAttendance.upsert({
    where: { assemblyId_ownerId: { assemblyId, ownerId } },
    update: { anwesend: data.anwesend, vertretenDurch: data.vertretenDurch ?? null },
    create: { assemblyId, ownerId, anwesend: data.anwesend, vertretenDurch: data.vertretenDurch ?? null },
  })

  revalidatePath(`/dashboard/weg`)
  return { success: true, data: null }
}
