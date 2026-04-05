import { describe, it, expect } from 'vitest'
import { tenantSchema } from '@/lib/schemas/tenant'

describe('tenantSchema', () => {
  it('accepts valid data', () => {
    const result = tenantSchema.safeParse({
      name: 'Thomas Müller',
      email: 'thomas@example.com',
      password: 'sicher1234',
      phone: '+49 111 222333',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = tenantSchema.safeParse({
      name: 'Test',
      email: 'not-an-email',
      password: 'sicher1234',
    })
    expect(result.success).toBe(false)
  })

  it('ignores unknown fields like password (tenant sets own password via invite)', () => {
    const result = tenantSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      password: '123',
    })
    // password is not part of tenantSchema — tenant receives an invite email and sets their own password
    expect(result.success).toBe(true)
  })
})
