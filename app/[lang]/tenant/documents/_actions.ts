'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getMyDocuments() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.companyId) return []

  // Mieter sieht: eigene Dokumente + Property-Dokumente seiner aktiven Leases + Globale der Company
  const leases = await prisma.lease.findMany({
    where: { tenantId: session.user.id, status: 'ACTIVE' },
    select: { unit: { select: { propertyId: true } } },
  })
  const propertyIds = leases.map(l => l.unit.propertyId)

  return prisma.document.findMany({
    where: {
      companyId: session.user.companyId,
      OR: [
        { scope: 'TENANT', tenantId: session.user.id },
        { scope: 'PROPERTY', propertyId: { in: propertyIds } },
        { scope: 'GLOBAL' },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })
}
