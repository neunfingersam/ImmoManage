import { describe, it, expect } from 'vitest'
import { shouldEscalate } from '@/lib/agent/escalation'

describe('shouldEscalate', () => {
  it('returns false when hasContext is true, regardless of response', () => {
    expect(shouldEscalate('steht nicht in den dokumenten', true)).toBe(false)
    expect(shouldEscalate('kann ich nicht beantworten, da ...', true)).toBe(false)
  })

  it('returns false for normal helpful responses without context', () => {
    expect(shouldEscalate('Ihre Kaltmiete beträgt 850 Euro.', false)).toBe(false)
    expect(shouldEscalate('Gerne helfe ich Ihnen dabei!', false)).toBe(false)
  })

  it('returns true for responses containing escalation keywords (no context)', () => {
    expect(shouldEscalate('Diese Information steht nicht in den dokumenten.', false)).toBe(true)
    expect(shouldEscalate('Das kann ich nicht beantworten, da keine Daten vorliegen.', false)).toBe(true)
    expect(shouldEscalate('Ich habe keine informationen dazu in den dokumenten.', false)).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(shouldEscalate('STEHT NICHT IN DEN DOKUMENTEN', false)).toBe(true)
  })
})
