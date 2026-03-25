import { describe, it, expect } from 'vitest'
import { parsePropertyRow, parseTenantRow, validateImportData } from '@/lib/excel-import'

describe('parsePropertyRow', () => {
  it('parst gültige Objekt-Zeile', () => {
    const result = parsePropertyRow({
      name: 'Musterhaus',
      address: 'Musterstrasse 1, 8001 Zürich',
      type: 'MFH',
      unitCount: 6,
      year: 1985,
    })
    expect(result.success).toBe(true)
    expect(result.data?.type).toBe('MULTI')
  })

  it('gibt Fehler bei fehlendem Namen zurück', () => {
    const result = parsePropertyRow({ name: '', address: 'Test', type: 'MFH', unitCount: 1 })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Name')
  })

  it('mappt EFH zu SINGLE', () => {
    const result = parsePropertyRow({ name: 'Test', address: 'Test', type: 'EFH', unitCount: 1 })
    expect(result.data?.type).toBe('SINGLE')
  })
})

describe('parseTenantRow', () => {
  it('parst gültige Mieter-Zeile', () => {
    const result = parseTenantRow({
      firstName: 'Hans',
      lastName: 'Muster',
      email: 'hans@example.com',
      phone: '+41 79 123 45 67',
      iban: 'CH56 0483 5012 3456 7800 9',
      propertyName: 'Musterhaus',
      unitNumber: '1.OG links',
      startDate: '01.01.2024',
      coldRent: 1200,
      extraCosts: 200,
    })
    expect(result.success).toBe(true)
    expect(result.data?.email).toBe('hans@example.com')
  })

  it('gibt Fehler bei ungültiger E-Mail zurück', () => {
    const result = parseTenantRow({
      firstName: 'Hans', lastName: 'Muster', email: 'not-an-email',
      propertyName: 'Test', unitNumber: '1', startDate: '01.01.2024', coldRent: 1000, extraCosts: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe('validateImportData', () => {
  it('erkennt doppelte E-Mails', () => {
    const tenants = [
      { email: 'same@test.com', firstName: 'A', lastName: 'B', propertyName: 'P', unitNumber: '1', startDate: '01.01.2024', coldRent: 1000, extraCosts: 0 },
      { email: 'same@test.com', firstName: 'C', lastName: 'D', propertyName: 'P', unitNumber: '2', startDate: '01.01.2024', coldRent: 1000, extraCosts: 0 },
    ]
    const errors = validateImportData({ properties: [], tenants })
    expect(errors.some(e => e.includes('doppelt'))).toBe(true)
  })
})
