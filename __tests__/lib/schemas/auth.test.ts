import { describe, it, expect } from 'vitest'
import { loginSchema } from '@/lib/schemas/auth'

describe('loginSchema', () => {
  it('sollte gültige Email und Passwort akzeptieren', () => {
    const result = loginSchema.safeParse({ email: 'test@example.de', password: 'demo1234' })
    expect(result.success).toBe(true)
  })

  it('sollte ungültige Email ablehnen', () => {
    const result = loginSchema.safeParse({ email: 'keine-email', password: 'demo1234' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Bitte gib eine gültige E-Mail-Adresse ein.')
  })

  it('sollte leeres Passwort ablehnen', () => {
    const result = loginSchema.safeParse({ email: 'test@example.de', password: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Bitte gib dein Passwort ein.')
  })

  it('sollte zu kurzes Passwort ablehnen', () => {
    const result = loginSchema.safeParse({ email: 'test@example.de', password: 'kurz' })
    expect(result.success).toBe(false)
  })
})
