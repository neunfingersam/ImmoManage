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

  it('rejects short password', () => {
    const result = tenantSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      password: '123',
    })
    expect(result.success).toBe(false)
  })
})
