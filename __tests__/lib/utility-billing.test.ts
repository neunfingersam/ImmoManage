import { describe, it, expect } from 'vitest'
import { calculateTenantShares, type CostItem, type UnitData } from '@/lib/utility-billing'

const units: UnitData[] = [
  { id: 'u1', size: 80, persons: 2, tenantId: 't1', tenantName: 'Anna Müller', akontoTotal: 600 },
  { id: 'u2', size: 60, persons: 1, tenantId: 't2', tenantName: 'Beat Huber', akontoTotal: 450 },
  { id: 'u3', size: 40, persons: 1, tenantId: 't3', tenantName: 'Carla Rossi', akontoTotal: 300 },
]

describe('calculateTenantShares — Verteilschlüssel sqm', () => {
  it('verteilt Kosten korrekt nach m²', () => {
    const costItems: CostItem[] = [
      { name: 'Heizung', amount: 1800, key: 'sqm' }
    ]
    const shares = calculateTenantShares(costItems, units)
    // Gesamt: 80+60+40 = 180m²
    // t1: 80/180 * 1800 = 800
    // t2: 60/180 * 1800 = 600
    // t3: 40/180 * 1800 = 400
    expect(shares.find(s => s.tenantId === 't1')?.totalShare).toBeCloseTo(800)
    expect(shares.find(s => s.tenantId === 't2')?.totalShare).toBeCloseTo(600)
    expect(shares.find(s => s.tenantId === 't3')?.totalShare).toBeCloseTo(400)
  })
})

describe('calculateTenantShares — Verteilschlüssel unit', () => {
  it('verteilt Kosten gleich pro Einheit', () => {
    const costItems: CostItem[] = [
      { name: 'Hauswartskosten', amount: 900, key: 'unit' }
    ]
    const shares = calculateTenantShares(costItems, units)
    // 900 / 3 = 300 pro Einheit
    for (const share of shares) {
      expect(share.totalShare).toBeCloseTo(300)
    }
  })
})

describe('calculateTenantShares — Verteilschlüssel persons', () => {
  it('verteilt Kosten nach Personenzahl', () => {
    const costItems: CostItem[] = [
      { name: 'Wassergebühren', amount: 800, key: 'persons' }
    ]
    const shares = calculateTenantShares(costItems, units)
    // Gesamt: 2+1+1 = 4 Personen
    // t1: 2/4 * 800 = 400
    // t2: 1/4 * 800 = 200
    // t3: 1/4 * 800 = 200
    expect(shares.find(s => s.tenantId === 't1')?.totalShare).toBeCloseTo(400)
    expect(shares.find(s => s.tenantId === 't2')?.totalShare).toBeCloseTo(200)
    expect(shares.find(s => s.tenantId === 't3')?.totalShare).toBeCloseTo(200)
  })
})

describe('calculateTenantShares — Saldo', () => {
  it('berechnet Nachzahlung/Rückerstattung korrekt', () => {
    const costItems: CostItem[] = [
      { name: 'Heizung', amount: 1800, key: 'sqm' }
    ]
    const shares = calculateTenantShares(costItems, units)
    // t1: Anteil 800, Akonto 600 → Nachzahlung 200
    const t1 = shares.find(s => s.tenantId === 't1')!
    expect(t1.balance).toBeCloseTo(200) // positiv = Nachzahlung
    // t2: Anteil 600, Akonto 450 → Nachzahlung 150
    const t2 = shares.find(s => s.tenantId === 't2')!
    expect(t2.balance).toBeCloseTo(150)
  })
})
