'use server'

import { getServerSession } from 'next-auth'
import { revalidateAllLocales } from '@/lib/revalidate'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireCompanyAccess } from '@/lib/auth-guard'
import { sendPushToUser } from '@/lib/push'
import type { ActionResult } from '@/lib/action-result'
import type { Document } from '@/lib/generated/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { documentUploadSchema } from '@/lib/schemas/document'
import { indexDocument } from '@/lib/agent/indexDocument'
import { getFolderTreeForProperty, getFolderWithAccess, ensurePersonalFolderForUser } from '@/lib/document-folders'

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
const MAX_SIZE = 20 * 1024 * 1024 // 20MB

export async function getDocuments(propertyId?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []

  return prisma.document.findMany({
    where: {
      companyId: session.user.companyId,
      ...(propertyId ? { propertyId } : {}),
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
        folderId: (formData.get('folderId') as string) || null,
      },
    })
  } catch (e) {
    try { await (await import('fs/promises')).unlink(filePath) } catch {}
    return { success: false, error: 'Fehler beim Speichern des Dokuments' }
  }

  // Fire-and-forget Indexierung (non-blocking)
  indexDocument(doc.id).catch(() => {})

  revalidateAllLocales('/dashboard/documents')
  if (parsed.data.scope === 'TENANT' && parsed.data.tenantId) {
    sendPushToUser(
      parsed.data.tenantId,
      'Neues Dokument',
      `Ein neues Dokument wurde für Sie bereitgestellt: ${parsed.data.name}`,
      `/tenant/documents`,
    ).catch(() => {})
  }
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

  revalidateAllLocales('/dashboard/documents')
  return { success: true, data: undefined }
}

export async function getFoldersForProperty(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []
  return getFolderTreeForProperty(propertyId, session as any)
}

export async function createSubFolder(data: { parentId: string; name: string }): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parent = await prisma.documentFolder.findFirst({
    where: { id: data.parentId, companyId: session.user.companyId },
  })
  if (!parent) return { success: false, error: 'Übergeordneter Ordner nicht gefunden' }
  if (parent.type === 'PERSONAL' && parent.ownerId !== (session.user as any).id) {
    const isAdmin = ['ADMIN', 'VERMIETER', 'SUPER_ADMIN'].includes((session.user as any).role)
    if (!isAdmin) return { success: false, error: 'Kein Zugriff' }
  }

  const folder = await prisma.documentFolder.create({
    data: {
      companyId: session.user.companyId,
      propertyId: parent.propertyId,
      type: parent.type,
      name: data.name.trim(),
      parentId: data.parentId,
      isSystem: false,
    },
  })
  revalidateAllLocales('/dashboard/documents')
  return { success: true, data: { id: folder.id } }
}

export async function deleteFolder(folderId: string): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const folder = await prisma.documentFolder.findFirst({
    where: { id: folderId, companyId: session.user.companyId },
    include: { _count: { select: { documents: true, children: true } } },
  })
  if (!folder) return { success: false, error: 'Ordner nicht gefunden' }
  if (folder.isSystem) return { success: false, error: 'Systemordner können nicht gelöscht werden' }
  if (folder._count.documents > 0 || folder._count.children > 0) {
    return { success: false, error: 'Ordner muss leer sein' }
  }

  await prisma.documentFolder.delete({ where: { id: folderId } })
  revalidateAllLocales('/dashboard/documents')
  return { success: true, data: null }
}

export async function getFolderContents(folderId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { folder: null, documents: [], subfolders: [], propertyName: null }

  let folder
  try { folder = await getFolderWithAccess(folderId, session as any) }
  catch { return { folder: null, documents: [], subfolders: [], propertyName: null } }

  const [documents, subfolders, property] = await Promise.all([
    prisma.document.findMany({
      where: { folderId, companyId: session.user.companyId },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.documentFolder.findMany({
      where: { parentId: folderId },
      orderBy: { name: 'asc' },
    }),
    folder.propertyId
      ? prisma.property.findUnique({ where: { id: folder.propertyId }, select: { name: true } })
      : Promise.resolve(null),
  ])

  return { folder, documents, subfolders, propertyName: property?.name ?? null }
}

export async function moveDocumentToFolder(documentId: string, folderId: string | null): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, companyId: session.user.companyId },
  })
  if (!doc) return { success: false, error: 'Dokument nicht gefunden' }

  await prisma.document.update({ where: { id: documentId }, data: { folderId } })
  revalidateAllLocales('/dashboard/documents')
  return { success: true, data: null }
}

export async function getPersonsForProperty(propertyId: string): Promise<{
  owners: { id: string; name: string }[]
  tenants: { id: string; name: string }[]
}> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { owners: [], tenants: [] }

  const [ownerRecords, leases] = await Promise.all([
    prisma.propertyOwner.findMany({
      where: { propertyId },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.lease.findMany({
      where: { unit: { propertyId }, status: 'ACTIVE' },
      include: { tenant: { select: { id: true, name: true } } },
    }),
  ])

  // Deduplicate tenants (one tenant may have multiple active leases)
  const tenantMap = new Map<string, { id: string; name: string }>()
  leases.forEach((l: { tenant: { id: string; name: string } }) => tenantMap.set(l.tenant.id, l.tenant))

  return {
    owners: ownerRecords.map((o: { user: { id: string; name: string } }) => o.user),
    tenants: Array.from(tenantMap.values()),
  }
}

export async function ensurePersonalFolderForUserAction(
  userId: string,
  propertyId: string,
): Promise<ActionResult<{ folderId: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })
  if (!user) return { success: false, error: 'Benutzer nicht gefunden' }

  const folder = await ensurePersonalFolderForUser(
    userId,
    propertyId,
    session.user.companyId,
    user.name,
  )
  return { success: true, data: { folderId: folder.id } }
}
