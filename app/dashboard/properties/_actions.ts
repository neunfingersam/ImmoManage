'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireCompanyAccess } from '@/lib/auth-guard'
import { propertySchema, type PropertyFormValues } from '@/lib/schemas/property'
import { unitSchema, type UnitFormValues } from '@/lib/schemas/unit'
import type { ActionResult } from '@/lib/action-result'
import type { Property, Unit } from '@/lib/generated/prisma'

function getAccessiblePropertyWhere(session: { user: { role: string; id: string; companyId: string | null } }) {
  const base = { companyId: session.user.companyId! }
  if (session.user.role === 'VERMIETER') {
    return { ...base, assignments: { some: { userId: session.user.id } } }
  }
  return base
}

export async function getProperties() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []
  return prisma.property.findMany({
    where: getAccessiblePropertyWhere(session),
    include: { _count: { select: { units: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProperty(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null
  return prisma.property.findFirst({
    where: { id: propertyId, ...getAccessiblePropertyWhere(session) },
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
    },
  })
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
    where: { id: propertyId, ...getAccessiblePropertyWhere(session) },
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
    where: { id: propertyId, ...getAccessiblePropertyWhere(session) },
  })
  if (!existing) return { success: false, error: 'Immobilie nicht gefunden' }

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
    where: { id: parsed.data.propertyId, ...getAccessiblePropertyWhere(session) },
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
    where: { id: parsed.data.propertyId, ...getAccessiblePropertyWhere(session) },
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
    where: { id: propertyId, ...getAccessiblePropertyWhere(session) },
  })
  if (!property) return { success: false, error: 'Zugriff verweigert' }

  await prisma.unit.delete({ where: { id: unitId } })
  revalidatePath(`/dashboard/properties/${propertyId}`)
  return { success: true, data: undefined }
}
