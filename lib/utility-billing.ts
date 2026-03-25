// lib/utility-billing.ts — Nebenkostenabrechnung Berechnungslogik

export type DistributionKey = 'sqm' | 'unit' | 'persons'

export interface CostItem {
  name: string
  amount: number
  key: DistributionKey
}

export interface UnitData {
  id: string
  size: number       // m²
  persons: number
  tenantId: string
  tenantName: string
  akontoTotal: number // geleistete NK-Akonto-Zahlungen
}

export interface TenantShare {
  tenantId: string
  tenantName: string
  unitId: string
  costBreakdown: Array<{
    name: string
    amount: number   // Gesamtkosten dieser Position
    key: DistributionKey
    share: number    // Anteil dieses Mieters
  }>
  totalShare: number   // Summe aller Anteile
  akontoTotal: number  // Geleistete Akontozahlungen
  balance: number      // positiv = Nachzahlung, negativ = Rückerstattung
}

/**
 * Berechnet den Mieteranteil pro Kostenposition für alle Einheiten.
 * @param costItems — Kostenpositionen mit Betrag und Verteilschlüssel
 * @param units — Einheiten mit m², Personen, Mieter-Infos
 */
export function calculateTenantShares(
  costItems: CostItem[],
  units: UnitData[]
): TenantShare[] {
  const totalSqm = units.reduce((sum, u) => sum + u.size, 0)
  const totalPersons = units.reduce((sum, u) => sum + u.persons, 0)
  const unitCount = units.length

  return units.map((unit) => {
    const costBreakdown = costItems.map((item) => {
      let weight: number

      switch (item.key) {
        case 'sqm':
          weight = totalSqm > 0 ? unit.size / totalSqm : 0
          break
        case 'unit':
          weight = unitCount > 0 ? 1 / unitCount : 0
          break
        case 'persons':
          weight = totalPersons > 0 ? unit.persons / totalPersons : 0
          break
        default:
          weight = 0
      }

      const share = item.amount * weight

      return {
        name: item.name,
        amount: item.amount,
        key: item.key,
        share: Math.round(share * 100) / 100, // auf Rappen runden
      }
    })

    const totalShare = costBreakdown.reduce((sum, b) => sum + b.share, 0)
    const balance = Math.round((totalShare - unit.akontoTotal) * 100) / 100

    return {
      tenantId: unit.tenantId,
      tenantName: unit.tenantName,
      unitId: unit.id,
      costBreakdown,
      totalShare: Math.round(totalShare * 100) / 100,
      akontoTotal: unit.akontoTotal,
      balance,
    }
  })
}
