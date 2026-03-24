import { describe, it, expect } from 'vitest'
import { getMonday, isSameDay, getWeekDays } from '@/lib/date-utils'

describe('getMonday', () => {
  it('returns Monday for a Wednesday input', () => {
    const wed = new Date('2026-03-25') // Wednesday
    const mon = getMonday(wed)
    expect(mon.getDay()).toBe(1) // 1 = Monday
    expect(mon.getDate()).toBe(23)
  })

  it('returns the same Monday for a Monday input', () => {
    const mon = new Date('2026-03-23') // Monday
    expect(getMonday(mon).getDate()).toBe(23)
  })

  it('handles Sunday (should go back to previous Monday)', () => {
    const sun = new Date('2026-03-29') // Sunday
    const mon = getMonday(sun)
    expect(mon.getDay()).toBe(1)
    expect(mon.getDate()).toBe(23)
  })
})

describe('isSameDay', () => {
  it('returns true for same date', () => {
    const a = new Date('2026-03-24T10:00:00')
    const b = new Date('2026-03-24T22:00:00')
    expect(isSameDay(a, b)).toBe(true)
  })

  it('returns false for different dates', () => {
    const a = new Date('2026-03-24')
    const b = new Date('2026-03-25')
    expect(isSameDay(a, b)).toBe(false)
  })
})

describe('getWeekDays', () => {
  it('returns 7 days starting from Monday', () => {
    const mon = new Date('2026-03-23')
    const days = getWeekDays(mon)
    expect(days).toHaveLength(7)
    expect(days[0].getDate()).toBe(23)
    expect(days[6].getDate()).toBe(29)
  })
})
