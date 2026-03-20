import { describe, it, expect } from 'vitest'
import type { ActionResult } from '@/lib/action-result'

describe('ActionResult type', () => {
  it('success shape compiles', () => {
    const r: ActionResult<{ id: string }> = { success: true, data: { id: '1' } }
    expect(r.success).toBe(true)
  })

  it('error shape compiles', () => {
    const r: ActionResult<never> = { success: false, error: 'Fehler' }
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBe('Fehler')
  })
})
