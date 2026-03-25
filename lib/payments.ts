// lib/payments.ts — Zahlungsverwaltungs-Logik

export type RentDemandStatusResult = 'PENDING' | 'PAID' | 'OVERDUE'

interface LeaseAmounts {
  coldRent: number
  extraCosts: number
}

interface DemandStatusInput {
  amount: number
  paidAmount: number
  dueDate: Date
}

/** Berechnet den monatlichen Sollbetrag einer Lease */
export function calculateRentDemandAmount(lease: LeaseAmounts): number {
  return lease.coldRent + lease.extraCosts
}

/** Berechnet den aktuellen Status eines RentDemand */
export function getRentDemandStatus(input: DemandStatusInput): RentDemandStatusResult {
  if (input.paidAmount >= input.amount) return 'PAID'
  if (input.dueDate < new Date()) return 'OVERDUE'
  return 'PENDING'
}

/** Gibt den 1. eines Monats zurück (UTC Mitternacht) */
export function getMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1))
}

/** Gibt das Fälligkeitsdatum zurück (1. des Monats + X Tage) */
export function getDueDate(monthStart: Date, dueDayOffset = 10): Date {
  return new Date(Date.UTC(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    dueDayOffset
  ))
}
