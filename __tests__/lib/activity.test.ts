import { describe, it, expect } from 'vitest'
import { formatActivityAction } from '@/lib/activity'

describe('formatActivityAction', () => {
  it('formatiert TENANT_CREATED korrekt', () => {
    const result = formatActivityAction('TENANT_CREATED', { tenantName: 'Hans Muster' })
    expect(result).toContain('Hans Muster')
    expect(result.toLowerCase()).toContain('mieter')
  })

  it('formatiert PAYMENT_RECORDED korrekt', () => {
    const result = formatActivityAction('PAYMENT_RECORDED', { amount: 1500 })
    expect(result).toContain('1500')
  })

  it('gibt Fallback für unbekannte Aktionen zurück', () => {
    const result = formatActivityAction('UNKNOWN_ACTION', {})
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
