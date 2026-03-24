'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireCompanyAccess } from '@/lib/auth-guard'
import { getPropertyWhere } from '@/lib/access-control'
import { propertySchema, type PropertyFormValues } from '@/lib/schemas/property'
import { unitSchema, type UnitFormValues } from '@/lib/schemas/unit'
import type { ActionResult } from '@/lib/action-result'
import type { Property, Unit } from '@/lib/generated/prisma'

export async function getProperties() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []
  return prisma.property.findMany({
    where: getPropertyWhere(session),
    include: { _count: { select: { units: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProperty(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null
  return prisma.property.findFirst({
    where: { id: propertyId, ...getPropertyWhere(session) },
    include: {
      units: {
        include: {
          leases: {
            where: { status: 'ACTIVE' },
            include: { tenant: { select: { id: true, name: true, email: true } } },
            take: 1,
          },
        },
        orderBy: { unitNumber: 'asc' },
      },
      assignments: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  })
}

export async function getVermieterForAssignment() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId || session.user.role !== 'ADMIN') return []
  return prisma.user.findMany({
    where: { companyId: session.user.companyId, role: 'VERMIETER', active: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })
}

export async function assignVermieterToProperty(propertyId: string, userId: string): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId || session.user.role !== 'ADMIN') return { success: false, error: 'Nicht autorisiert' }

  const [property, vermieter] = await Promise.all([
    prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } }),
    prisma.user.findFirst({ where: { id: userId, companyId: session.user.companyId, role: 'VERMIETER' } }),
  ])
  if (!property) return { success: false, error: 'Immobilie nicht gefunden' }
  if (!vermieter) return { success: false, error: 'Vermieter nicht gefunden' }

  await prisma.propertyAssignment.upsert({
    where: { userId_propertyId: { userId, propertyId } },
    create: { userId, propertyId },
    update: {},
  })
  revalidatePath(`/dashboard/properties/${propertyId}`)
  return { success: true, data: undefined }
}

export async function removeVermieterFromProperty(propertyId: string, userId: string): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId || session.user.role !== 'ADMIN') return { success: false, error: 'Nicht autorisiert' }

  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) return { success: false, error: 'Immobilie nicht gefunden' }

  await prisma.propertyAssignment.deleteMany({ where: { propertyId, userId } })
  revalidatePath(`/dashboard/properties/${propertyId}`)
  return { success: true, data: undefined }
}

export async function createProperty(data: PropertyFormValues): Promise<ActionResult<Property>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)

  const parsed = propertySchema.safeParse(data)
  if (!parsed.success) return { success: false, error: (parsed.error as any).issues?.[0]?.message ?? parsed.error.message }

  try {
    const property = await prisma.property.create({
      data: {
        ...parsed.data,
        companyId: session.user.companyId,
        year: parsed.data.year ?? null,
        description: parsed.data.description ?? null,
      },
    })
    if (session.user.role === 'VERMIETER') {
      await prisma.propertyAssignment.create({
        data: { userId: session.user.id, propertyId: property.id },
      })
    }
    revalidatePath('/dashboard/properties')
    return { success: true, data: property }
  } catch (e) {
    return { success: false, error: 'Fehler beim Erstellen der Immobilie' }
  }
}

export async function updateProperty(propertyId: string, data: PropertyFormValues): Promise<ActionResult<Property>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)

  const parsed = propertySchema.safeParse(data)
  if (!parsed.success) return { success: false, error: (parsed.error as any).issues?.[0]?.message ?? parsed.error.message }

  const existing = await prisma.property.findFirst({
    where: { id: propertyId, ...getPropertyWhere(session) },
  })
  if (!existing) return { success: false, error: 'Immobilie nicht gefunden' }

  try {
    const property = await prisma.property.update({
      where: { id: propertyId },
      data: { ...parsed.data, year: parsed.data.year ?? null, description: parsed.data.description ?? null },
    })
    revalidatePath('/dashboard/properties')
    revalidatePath(`/dashboard/properties/${propertyId}`)
    return { success: true, data: property }
  } catch (e) {
    return { success: false, error: 'Fehler beim Aktualisieren' }
  }
}

export async function deleteProperty(propertyId: string): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)

  const existing = await prisma.property.findFirst({
    where: { id: propertyId, ...getPropertyWhere(session) },
  })
  if (!existing) return { success: false, error: 'Immobilie nicht gefunden' }

  const activeLeases = await prisma.lease.count({
    where: { unit: { propertyId }, status: 'ACTIVE' },
  })
  if (activeLeases > 0) return { success: false, error: 'Immobilie hat noch aktive Mietverträge' }

  await prisma.property.delete({ where: { id: propertyId } })
  revalidatePath('/dashboard/properties')
  return { success: true, data: undefined }
}

export async function createUnit(data: UnitFormValues): Promise<ActionResult<Unit>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = unitSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: (parsed.error as any).issues?.[0]?.message ?? parsed.error.message }

  const property = await prisma.property.findFirst({
    where: { id: parsed.data.propertyId, ...getPropertyWhere(session) },
  })
  if (!property) return { success: false, error: 'Immobilie nicht gefunden' }

  try {
    const unit = await prisma.unit.create({
      data: {
        propertyId: parsed.data.propertyId,
        unitNumber: parsed.data.unitNumber,
        floor: parsed.data.floor ?? null,
        size: parsed.data.size ?? null,
        rooms: parsed.data.rooms ?? null,
      },
    })
    revalidatePath(`/dashboard/properties/${parsed.data.propertyId}`)
    return { success: true, data: unit }
  } catch (e) {
    return { success: false, error: 'Fehler beim Erstellen der Einheit' }
  }
}

export async function updateUnit(unitId: string, data: UnitFormValues): Promise<ActionResult<Unit>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = unitSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: (parsed.error as any).issues?.[0]?.message ?? parsed.error.message }

  const property = await prisma.property.findFirst({
    where: { id: parsed.data.propertyId, ...getPropertyWhere(session) },
  })
  if (!property) return { success: false, error: 'Zugriff verweigert' }

  try {
    const unit = await prisma.unit.update({
      where: { id: unitId },
      data: {
        unitNumber: parsed.data.unitNumber,
        floor: parsed.data.floor ?? null,
        size: parsed.data.size ?? null,
        rooms: parsed.data.rooms ?? null,
      },
    })
    revalidatePath(`/dashboard/properties/${parsed.data.propertyId}`)
    return { success: true, data: unit }
  } catch (e) {
    return { success: false, error: 'Fehler beim Aktualisieren der Einheit' }
  }
}

export async function deleteUnit(unitId: string, propertyId: string): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const property = await prisma.property.findFirst({
    where: { id: propertyId, ...getPropertyWhere(session) },
  })
  if (!property) return { success: false, error: 'Zugriff verweigert' }

  const activeLeases = await prisma.lease.count({
    where: { unitId, status: 'ACTIVE' },
  })
  if (activeLeases > 0) return { success: false, error: 'Einheit hat noch aktive Mietverträge' }

  await prisma.unit.delete({ where: { id: unitId } })
  revalidatePath(`/dashboard/properties/${propertyId}`)
  return { success: true, data: undefined }
}
