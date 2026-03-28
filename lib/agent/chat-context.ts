// lib/agent/chat-context.ts
import { prisma } from '@/lib/prisma'

export type LeaseContextResult = {
  leaseContext: string
  billContext: string
  propertyIds: string[]
  unitInfo: string | null
}

/**
 * Loads the tenant's active leases + utility bills and returns formatted context strings
 * for the AI prompt.
 */
export async function buildTenantContext(userId: string): Promise<LeaseContextResult> {
  const leases = await prisma.lease.findMany({
    where: { tenantId: userId, status: 'ACTIVE' },
    include: {
      unit: { include: { property: { select: { id: true, name: true, address: true, type: true } } } },
    },
  })
  const propertyIds = leases.map(l => l.unit.propertyId)

  const leaseContext = leases.map(l => {
    const warmmiete = l.coldRent + l.extraCosts
    const start = new Date(l.startDate).toLocaleDateString('de-DE')
    const end = l.endDate ? new Date(l.endDate).toLocaleDateString('de-DE') : 'unbefristet'
    return `=== Mietvertrag ===
Immobilie: ${l.unit.property.name}
Adresse: ${l.unit.property.address}
Einheit: ${l.unit.unitNumber}${l.unit.floor != null ? ` (Etage ${l.unit.floor})` : ''}${l.unit.size != null ? `, ${l.unit.size} m²` : ''}${l.unit.rooms != null ? `, ${l.unit.rooms} Zimmer` : ''}
Mietbeginn: ${start}
Mietende: ${end}
Kaltmiete: ${l.coldRent.toFixed(2)} €/Monat
Nebenkosten-Vorauszahlung: ${l.extraCosts.toFixed(2)} €/Monat
Warmmiete gesamt: ${warmmiete.toFixed(2)} €/Monat
Kautionsstatus: ${l.depositPaid ? 'Kaution bezahlt' : 'Kaution noch offen'}`
  }).join('\n\n')

  const unitInfo = leases[0]
    ? `Einheit ${leases[0].unit.unitNumber}, ${leases[0].unit.property.name}, ${leases[0].unit.property.address}`
    : null

  const utilityBills = await prisma.utilityBill.findMany({
    where: { lease: { tenantId: userId } },
    orderBy: { year: 'desc' },
    take: 5,
    include: { property: { select: { name: true } } },
  })
  const billContext = utilityBills.length > 0
    ? `=== Nebenkostenabrechnungen ===\n` + utilityBills.map(b =>
        `Jahr ${b.year}: ${b.amount.toFixed(2)} € (${b.property.name})${b.sentAt ? ` — zugestellt am ${new Date(b.sentAt).toLocaleDateString('de-DE')}` : ''}`
      ).join('\n')
    : ''

  return { leaseContext, billContext, propertyIds, unitInfo }
}

/**
 * Searches documents for the tenant: tries Vectra vector search first,
 * falls back to raw extractedText from DB.
 */
export async function searchTenantDocuments(
  queryVector: number[],
  companyId: string,
  userId: string,
  propertyIds: string[],
  queryChunksFn: (vec: number[], opts: { companyId: string; tenantId: string; propertyIds: string[] }) => Promise<Array<{ text: string; documentId: string }>>
): Promise<{ contextText: string; chunkIds: string[] }> {
  let chunks: Array<{ text: string; documentId: string }> = []
  try {
    chunks = await queryChunksFn(queryVector, { companyId, tenantId: userId, propertyIds })
  } catch { /* vectra not available on serverless — DB fallback below */ }

  if (chunks.length > 0) {
    return {
      contextText: chunks.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n'),
      chunkIds: chunks.map(c => c.documentId),
    }
  }

  // Fallback: full extractedText from DB
  const docs = await prisma.document.findMany({
    where: {
      companyId,
      OR: [
        { scope: 'TENANT', tenantId: userId },
        { scope: 'PROPERTY', propertyId: { in: propertyIds } },
        { scope: 'GLOBAL' },
      ],
      extractedText: { not: null },
    },
    select: { name: true, extractedText: true },
  })

  const contextText = docs.length > 0
    ? docs
        .filter(d => d.extractedText && d.extractedText.length > 0)
        .map(d => `Dokument "${d.name}":\n${d.extractedText!.slice(0, 3000)}`)
        .join('\n\n---\n\n')
    : ''

  return { contextText, chunkIds: [] }
}
