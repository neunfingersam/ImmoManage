import { describe, it, expect } from 'vitest'
import { propertySchema } from '@/lib/schemas/property'

describe('propertySchema', () => {
  it('accepts valid data', () => {
    const result = propertySchema.safeParse({
      name: 'Musterstr. 1',
      address: 'Musterstraße 1, 10115 Berlin',
      type: 'MULTI',
      unitCount: 3,
      year: 2000,
      description: 'Test',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = propertySchema.safeParse({
      name: '',
      address: 'Musterstraße 1',
      type: 'SINGLE',
      unitCount: 1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type', () => {
    const result = propertySchema.safeParse({
      name: 'Test',
      address: 'Str. 1',
      type: 'INVALID',
      unitCount: 1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects unitCount less than 1', () => {
    const result = propertySchema.safeParse({
      name: 'Test',
      address: 'Str. 1',
      type: 'SINGLE',
      unitCount: 0,
    })
    expect(result.success).toBe(false)
  })
})
