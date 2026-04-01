import { prisma } from '@/lib/prisma'
import type { Session } from 'next-auth'

export async function ensureSystemFolders(propertyId: string, companyId: string) {
  const existing = await prisma.documentFolder.findMany({
    where: { propertyId, isSystem: true, parentId: null },
  })
  const existingTypes = existing.map((f: { type: string }) => f.type)

  const toCreate = (
    [
      { type: 'GENERAL' as const, name: 'Allgemeine Dokumente' },
      { type: 'ASSEMBLY' as const, name: 'Versammlungen' },
    ] as { type: 'GENERAL' | 'ASSEMBLY'; name: string }[]
  ).filter((f) => !existingTypes.includes(f.type))

  for (const folder of toCreate) {
    await prisma.documentFolder.create({
      data: { companyId, propertyId, type: folder.type, name: folder.name, isSystem: true },
    })
  }
}

export async function ensureOwnerPersonalFolder(
  ownerId: string,
  propertyId: string,
  companyId: string,
  ownerName: string,
) {
  const existing = await prisma.documentFolder.findFirst({
    where: { ownerId, propertyId, type: 'PERSONAL', isSystem: true },
  })
  if (existing) return existing
  return prisma.documentFolder.create({
    data: {
      companyId, propertyId, ownerId,
      type: 'PERSONAL',
      name: `Persönliche Dokumente — ${ownerName}`,
      isSystem: true,
    },
  })
}

export async function ensureAssemblyFolder(
  assemblyId: string,
  propertyId: string,
  companyId: string,
  assemblyLabel: string,
) {
  const existing = await prisma.documentFolder.findFirst({
    where: { assemblyId, type: 'ASSEMBLY' },
  })
  if (existing) return existing

  const parent = await prisma.documentFolder.findFirst({
    where: { propertyId, type: 'ASSEMBLY', isSystem: true, parentId: null },
  })

  return prisma.documentFolder.create({
    data: {
      companyId, propertyId, assemblyId,
      type: 'ASSEMBLY',
      name: assemblyLabel,
      isSystem: true,
      parentId: parent?.id ?? null,
    },
  })
}

export async function getFolderWithAccess(
  folderId: string,
  session: Session,
) {
  const folder = await prisma.documentFolder.findFirst({
    where: { id: folderId, companyId: (session.user as any).companyId },
    include: { parent: true, children: true },
  })
  if (!folder) throw new Error('Ordner nicht gefunden')

  if (folder.type === 'PERSONAL') {
    const isOwner = folder.ownerId === (session.user as any).id
    const isAdmin = ['ADMIN', 'VERMIETER', 'SUPER_ADMIN'].includes((session.user as any).role)
    if (!isOwner && !isAdmin) throw new Error('Kein Zugriff')
  }

  return folder
}

export async function getFolderTreeForProperty(
  propertyId: string,
  session: Session,
) {
  const isAdmin = ['ADMIN', 'VERMIETER', 'SUPER_ADMIN'].includes((session.user as any).role)

  return prisma.documentFolder.findMany({
    where: {
      propertyId,
      companyId: (session.user as any).companyId,
      ...(isAdmin
        ? {}
        : {
            OR: [
              { type: 'GENERAL' },
              { type: 'ASSEMBLY' },
              { type: 'PERSONAL', ownerId: (session.user as any).id },
            ],
          }),
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })
}
