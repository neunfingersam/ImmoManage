// lib/tax.ts — Swiss landlord tax calculations
import { prisma } from '@/lib/prisma'

export interface TaxPropertyResult {
  propertyId: string
  propertyName: string
  propertyAddress: string
  buildingYear: number | null
  units: TaxUnitResult[]
  // Totals
  grossRentalIncome: number   // Nettomiete received
  extraCostsIncome: number    // Nebenkosten-Einnahmen
  totalIncome: number         // gross + extra
  vacancyLoss: number         // Leerstand-Ausfall
  repairCosts: number         // Unterhalt aus Tickets
  pauschalRate: number        // 10 or 20
  pauschalAbzug: number       // totalIncome * rate
  recommendation: 'pauschal' | 'effektiv'
  taxableIncomePauschal: number
  taxableIncomeEffektiv: number
  taxableIncome: number       // recommended
}

export interface TaxUnitResult {
  unitId: string
  unitNumber: string
  months: number        // occupied months
  coldRent: number      // monthly rate
  extraCosts: number
  annualRent: number
  annualExtra: number
  vacancyMonths: number
  vacancyLoss: number
  tenantName: string | null
}

export interface TaxSummary {
  year: number
  properties: TaxPropertyResult[]
  totalIncome: number
  totalRepairCosts: number
  totalPauschalAbzug: number
  totalTaxableIncomePauschal: number
  totalTaxableIncomeEffektiv: number
  totalTaxableIncome: number
}

export async function computeTaxSummary(companyId: string, year: number): Promise<TaxSummary> {
  const yearStart = new Date(year, 0, 1)
  const yearEnd   = new Date(year, 11, 31, 23, 59, 59)

  const properties = await prisma.property.findMany({
    where: { companyId },
    include: {
      units: {
        include: {
          leases: {
            include: {
              tenant: { select: { name: true } },
              rentDemands: {
                where: { year },
                include: { payments: true },
              },
            },
          },
          tickets: {
            where: {
              companyId,
              repairCost: { not: null },
              createdAt: { gte: yearStart, lte: yearEnd },
            },
            select: { repairCost: true },
          },
        },
      },
      tickets: {
        where: {
          companyId,
          repairCost: { not: null },
          createdAt: { gte: yearStart, lte: yearEnd },
        },
        select: { repairCost: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const results: TaxPropertyResult[] = []

  for (const prop of properties) {
    const unitResults: TaxUnitResult[] = []
    let propGrossRent = 0
    let propExtraCosts = 0
    let propVacancyLoss = 0
    let propRepairCosts = 0

    // Property-level ticket costs
    propRepairCosts += prop.tickets.reduce((s, t) => s + (t.repairCost ?? 0), 0)

    for (const unit of prop.units) {
      // Unit-level ticket costs
      propRepairCosts += unit.tickets.reduce((s, t) => s + (t.repairCost ?? 0), 0)

      // Find lease(s) active during this year
      const activeLeases = unit.leases.filter(l => {
        const start = new Date(l.startDate)
        const end = l.endDate ? new Date(l.endDate) : new Date(year, 11, 31)
        return start <= yearEnd && end >= yearStart
      })

      if (activeLeases.length === 0) {
        // Fully vacant all year
        unitResults.push({
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          months: 0,
          coldRent: 0,
          extraCosts: 0,
          annualRent: 0,
          annualExtra: 0,
          vacancyMonths: 12,
          vacancyLoss: 0,
          tenantName: null,
        })
        continue
      }

      let unitGross = 0
      let unitExtra = 0
      let unitVacancyLoss = 0
      let unitMonths = 0
      let tenantName: string | null = null

      for (const lease of activeLeases) {
        tenantName = lease.tenant.name

        // Count months of this lease within the year
        const leaseStart = new Date(lease.startDate)
        const leaseEnd = lease.endDate ? new Date(lease.endDate) : new Date(year, 11, 31)
        const effectiveStart = leaseStart < yearStart ? yearStart : leaseStart
        const effectiveEnd = leaseEnd > yearEnd ? yearEnd : leaseEnd
        const months = monthsBetween(effectiveStart, effectiveEnd)

        // Actual payments received for this year
        const paidRent = lease.rentDemands.reduce((sum, rd) => {
          return sum + rd.payments.reduce((s, p) => s + p.amount, 0)
        }, 0)

        // Expected rent (fallback if no payment data)
        const expectedRent = lease.coldRent * months
        const expectedExtra = lease.extraCosts * months

        unitGross += paidRent > 0 ? paidRent : expectedRent
        unitExtra += expectedExtra
        unitMonths += months
      }

      // Vacancy: months where unit was not leased within the year
      const vacancyMonths = Math.max(0, 12 - unitMonths)
      // Estimate vacancy loss based on lease rate
      const avgMonthlyRent = activeLeases[0]?.coldRent ?? 0
      unitVacancyLoss = vacancyMonths * avgMonthlyRent

      propGrossRent += unitGross
      propExtraCosts += unitExtra
      propVacancyLoss += unitVacancyLoss

      unitResults.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        months: unitMonths,
        coldRent: activeLeases[0]?.coldRent ?? 0,
        extraCosts: activeLeases[0]?.extraCosts ?? 0,
        annualRent: unitGross,
        annualExtra: unitExtra,
        vacancyMonths,
        vacancyLoss: unitVacancyLoss,
        tenantName,
      })
    }

    const totalIncome = propGrossRent + propExtraCosts
    // Pauschalabzug: 20% if building >= 10 years old, else 10%
    const buildingAge = prop.year ? (year - prop.year) : null
    const pauschalRate = buildingAge === null ? 20 : buildingAge >= 10 ? 20 : 10
    const pauschalAbzug = totalIncome * (pauschalRate / 100)

    const taxablePauschal = Math.max(0, totalIncome - pauschalAbzug)
    const taxableEffektiv = Math.max(0, totalIncome - propRepairCosts)
    const recommendation = taxableEffektiv < taxablePauschal ? 'effektiv' : 'pauschal'

    results.push({
      propertyId: prop.id,
      propertyName: prop.name,
      propertyAddress: prop.address,
      buildingYear: prop.year,
      units: unitResults,
      grossRentalIncome: propGrossRent,
      extraCostsIncome: propExtraCosts,
      totalIncome,
      vacancyLoss: propVacancyLoss,
      repairCosts: propRepairCosts,
      pauschalRate,
      pauschalAbzug,
      recommendation,
      taxableIncomePauschal: taxablePauschal,
      taxableIncomeEffektiv: taxableEffektiv,
      taxableIncome: recommendation === 'pauschal' ? taxablePauschal : taxableEffektiv,
    })
  }

  const totalIncome = results.reduce((s, p) => s + p.totalIncome, 0)
  const totalRepairCosts = results.reduce((s, p) => s + p.repairCosts, 0)
  const totalPauschalAbzug = results.reduce((s, p) => s + p.pauschalAbzug, 0)

  return {
    year,
    properties: results,
    totalIncome,
    totalRepairCosts,
    totalPauschalAbzug,
    totalTaxableIncomePauschal: results.reduce((s, p) => s + p.taxableIncomePauschal, 0),
    totalTaxableIncomeEffektiv: results.reduce((s, p) => s + p.taxableIncomeEffektiv, 0),
    totalTaxableIncome: results.reduce((s, p) => s + p.taxableIncome, 0),
  }
}

function monthsBetween(start: Date, end: Date): number {
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) + 1
  return Math.max(0, Math.min(12, months))
}
