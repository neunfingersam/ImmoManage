import { describe, it, expect } from 'vitest'
import { unitSchema } from '@/lib/schemas/unit'

describe('unitSchema', () => {
  it('accepts valid data', () => {
    const result = unitSchema.safeParse({
      propertyId: 'prop-1',
      unitNumber: 'EG links',
      floor: 0,
      size: 72.5,
      rooms: 3,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty unitNumber', () => {
    const result = unitSchema.safeParse({
      propertyId: 'prop-1',
      unitNumber: '',
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional fields absent', () => {
    const result = unitSchema.safeParse({
      propertyId: 'prop-1',
      unitNumber: 'DG',
    })
    expect(result.success).toBe(true)
  })
})
