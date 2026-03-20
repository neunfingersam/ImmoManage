import { describe, it, expect } from 'vitest'
import { leaseSchema } from '@/lib/schemas/lease'

describe('leaseSchema', () => {
  it('accepts valid data', () => {
    const result = leaseSchema.safeParse({
      unitId: 'unit-1',
      tenantId: 'user-1',
      startDate: '2024-01-01',
      coldRent: 850,
      extraCosts: 150,
      depositPaid: false,
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative coldRent', () => {
    const result = leaseSchema.safeParse({
      unitId: 'unit-1',
      tenantId: 'user-1',
      startDate: '2024-01-01',
      coldRent: -100,
      extraCosts: 150,
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional endDate', () => {
    const result = leaseSchema.safeParse({
      unitId: 'unit-1',
      tenantId: 'user-1',
      startDate: '2024-01-01',
      coldRent: 800,
      extraCosts: 100,
    })
    expect(result.success).toBe(true)
  })
})
