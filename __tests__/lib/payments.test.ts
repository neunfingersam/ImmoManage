import { describe, it, expect } from 'vitest'
import {
  calculateRentDemandAmount,
  getRentDemandStatus,
  getMonthStart,
} from '@/lib/payments'

describe('calculateRentDemandAmount', () => {
  it('gibt coldRent + extraCosts zurück', () => {
    const result = calculateRentDemandAmount({ coldRent: 1200, extraCosts: 300 })
    expect(result).toBe(1500)
  })

  it('gibt nur coldRent zurück wenn extraCosts fehlen', () => {
    const result = calculateRentDemandAmount({ coldRent: 1200, extraCosts: 0 })
    expect(result).toBe(1200)
  })
})

describe('getRentDemandStatus', () => {
  it('gibt PAID zurück wenn vollständig bezahlt', () => {
    const status = getRentDemandStatus({ amount: 1500, paidAmount: 1500, dueDate: new Date('2026-01-10') })
    expect(status).toBe('PAID')
  })

  it('gibt OVERDUE zurück wenn überfällig und nicht bezahlt', () => {
    const pastDate = new Date('2020-01-01')
    const status = getRentDemandStatus({ amount: 1500, paidAmount: 0, dueDate: pastDate })
    expect(status).toBe('OVERDUE')
  })

  it('gibt PENDING zurück wenn nicht fällig', () => {
    const futureDate = new Date('2099-12-31')
    const status = getRentDemandStatus({ amount: 1500, paidAmount: 0, dueDate: futureDate })
    expect(status).toBe('PENDING')
  })
})

describe('getMonthStart', () => {
  it('gibt den 1. des Monats zurück', () => {
    const result = getMonthStart(new Date('2026-03-15'))
    expect(result.getDate()).toBe(1)
    expect(result.getMonth()).toBe(2) // März = 2
    expect(result.getFullYear()).toBe(2026)
  })
})
