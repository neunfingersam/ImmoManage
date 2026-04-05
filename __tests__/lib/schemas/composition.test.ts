import { describe, it, expect } from 'vitest'
import { tenantSchema, updateTenantSchema, updateProfileSchema } from '@/lib/schemas/tenant'
import { ticketSchema } from '@/lib/schemas/ticket'

describe('tenantSchema', () => {
  it('accepts valid data', () => {
    const result = tenantSchema.safeParse({
      name: 'Max Mustermann',
      email: 'max@example.com',
      password: 'sicher123',
      phone: null,
    })
    expect(result.success).toBe(true)
  })

  it('accepts input without password (tenant sets own password via invite)', () => {
    const result = tenantSchema.safeParse({ name: 'Max', email: 'max@example.com' })
    // password is not part of tenantSchema — tenants set their own password via invite email
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = tenantSchema.safeParse({ name: 'Max', email: 'not-an-email', password: 'pass1234' })
    expect(result.success).toBe(false)
  })

  it('does not include whatsapp field', () => {
    const result = tenantSchema.safeParse({
      name: 'Max',
      email: 'max@example.com',
      password: 'pass1234',
      whatsapp: '+49123',
    })
    // whatsapp is stripped by omit — parse still succeeds, extra key is ignored
    expect(result.success).toBe(true)
    if (result.success) expect((result.data as any).whatsapp).toBeUndefined()
  })
})

describe('updateTenantSchema', () => {
  it('accepts valid data without password', () => {
    const result = updateTenantSchema.safeParse({
      name: 'Max',
      email: 'max@example.com',
      phone: '+49123456',
      whatsapp: null,
    })
    expect(result.success).toBe(true)
  })
})

describe('updateProfileSchema and updateTenantSchema are equivalent', () => {
  it('both accept the same valid input', () => {
    const input = { name: 'Anna', email: 'anna@test.de', phone: null, whatsapp: null }
    expect(updateTenantSchema.safeParse(input).success).toBe(true)
    expect(updateProfileSchema.safeParse(input).success).toBe(true)
  })
})

describe('ticketSchema', () => {
  it('accepts valid ticket', () => {
    const result = ticketSchema.safeParse({
      title: 'Heizung defekt',
      description: 'Die Heizung im Wohnzimmer funktioniert nicht.',
      propertyId: 'prop-123',
      unitId: null,
      priority: 'HIGH',
    })
    expect(result.success).toBe(true)
  })

  it('defaults priority to MEDIUM', () => {
    const result = ticketSchema.safeParse({
      title: 'Test',
      description: 'Test',
      propertyId: 'prop-123',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.priority).toBe('MEDIUM')
  })
})
