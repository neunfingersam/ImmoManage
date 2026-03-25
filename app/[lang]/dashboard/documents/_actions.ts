'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireCompanyAccess } from '@/lib/auth-guard'
import type { ActionResult } from '@/lib/action-result'
import type { Document } from '@/lib/generated/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { documentUploadSchema } from '@/lib/schemas/document'
import { indexDocument } from '@/lib/agent/indexDocument'

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
const MAX_SIZE = 20 * 1024 * 1024 // 20MB

export async function getDocuments(scopeFilter?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []

  return prisma.document.findMany({
    where: {
      companyId: session.user.companyId,
      ...(scopeFilter ? { scope: scopeFilter as Document['scope'] } : {}),
    },
    include: {
      uploadedBy: { select: { id: true, name: true } },
      tenant: { select: { id: true, name: true } },
      property: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function uploadDocument(formData: FormData): Promise<ActionResult<Document>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { success: false, error: 'Keine Datei ausgewählt' }
  if (!ALLOWED_TYPES.includes(file.type)) return { success: false, error: 'Dateityp nicht erlaubt (PDF, DOCX, JPG, PNG)' }
  if (file.size > MAX_SIZE) return { success: false, error: 'Datei zu groß (max. 20 MB)' }

  // Magic-byte Validierung
  const headerBytes = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const hex = Array.from(headerBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const isPdf = hex.startsWith('255044462d') // %PDF-
  const isDocx = hex.startsWith('504b0304')   // PK (ZIP-based)
  const isJpeg = hex.startsWith('ffd8ff')
  const isPng = hex.startsWith('89504e47')
  const validMagic = isPdf || isDocx || isJpeg || isPng
  if (!validMagic) return { success: false, error: 'Dateiinhalt entspricht nicht dem deklarierten Typ' }

  const raw = {
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    scope: formData.get('scope') as string,
    tenantId: (formData.get('tenantId') as string) || null,
    propertyId: (formData.get('propertyId') as string) || null,
  }

  const parsed = documentUploadSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues?.[0]?.message ?? 'Validierungsfehler' }

  const ext = path.extname(file.name)
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  const uploadDir = path.join(process.cwd(), 'private', 'uploads', session.user.companyId, session.user.id)
  await mkdir(uploadDir, { recursive: true })
  const filePath = path.join(uploadDir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  const fileUrl = `/api/uploads/${session.user.companyId}/${session.user.id}/${filename}`

  let doc: Document
  try {
    doc = await prisma.document.create({
      data: {
        companyId: session.user.companyId,
        name: parsed.data.name,
        category: parsed.data.category,
        scope: parsed.data.scope,
        fileUrl,
        fileType: file.type,
        tenantId: parsed.data.tenantId ?? null,
        propertyId: parsed.data.propertyId ?? null,
        uploadedById: session.user.id,
      },
    })
  } catch (e) {
    try { await (await import('fs/promises')).unlink(filePath) } catch {}
    return { success: false, error: 'Fehler beim Speichern des Dokuments' }
  }

  // Fire-and-forget Indexierung (non-blocking)
  indexDocument(doc.id).catch(() => {})

  revalidatePath('/dashboard/documents')
  return { success: true, data: doc }
}

export async function deleteDocument(documentId: string): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, companyId: session.user.companyId },
  })
  if (!doc) return { success: false, error: 'Dokument nicht gefunden' }

  await prisma.document.delete({ where: { id: documentId } })

  try {
    const { unlink } = await import('fs/promises')
    const filePath = path.join(process.cwd(), 'private', doc.fileUrl.replace(/^\/api\//, ''))
    await unlink(filePath)
  } catch { /* Datei bereits gelöscht oder nicht gefunden */ }

  revalidatePath('/dashboard/documents')
  return { success: true, data: undefined }
}
