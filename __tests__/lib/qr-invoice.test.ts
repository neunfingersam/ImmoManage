import { describe, it, expect } from 'vitest'
import { formatSwissIban, buildQrPayload } from '@/lib/qr-invoice'

describe('formatSwissIban', () => {
  it('formatiert IBAN mit Leerzeichen', () => {
    const result = formatSwissIban('CH5604835012345678009')
    expect(result).toBe('CH56 0483 5012 3456 7800 9')
  })

  it('akzeptiert bereits formatierte IBAN', () => {
    const result = formatSwissIban('CH56 0483 5012 3456 7800 9')
    expect(result).toBe('CH56 0483 5012 3456 7800 9')
  })
})

describe('buildQrPayload', () => {
  it('erstellt gültigen QR-Payload', () => {
    const payload = buildQrPayload({
      iban: 'CH5604835012345678009',
      creditorName: 'Muster Verwaltung AG',
      creditorAddress: 'Musterstrasse 1',
      creditorCity: '8001 Zürich',
      amount: 1500,
      currency: 'CHF',
      reference: 'Miete März 2026 - Hans Muster',
    })
    expect(payload).toContain('SPC')
    expect(payload).toContain('CH5604835012345678009')
    expect(payload).toContain('1500.00')
    expect(payload).toContain('CHF')
  })
})
