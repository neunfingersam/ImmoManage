'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { FileDown, FileSpreadsheet, TrendingDown, Building2, CheckCircle, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { TaxSummary } from '@/lib/tax'

function chf(n: number) {
  const parts = n.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  return `CHF ${parts[0]}.${parts[1]}`
}

export function TaxDashboard({ summary, availableYears }: { summary: TaxSummary; availableYears: number[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('tax')
  const locale = useLocale()

  function setYear(year: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', year)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle', { year: summary.year })}
          </p>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-2">
          <select
            className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground"
            value={summary.year}
            onChange={e => setYear(e.target.value)}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <a href={`/api/tax?year=${summary.year}&format=pdf&lang=${locale}`} target="_blank">
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </a>
          <a href={`/api/tax?year=${summary.year}&format=xlsx&lang=${locale}`}>
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </a>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('totalIncome')}</p>
          <p className="text-lg font-semibold text-foreground">{chf(summary.totalIncome)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('repairCosts')}</p>
          <p className="text-lg font-semibold text-foreground">{chf(summary.totalRepairCosts)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('flatDeduction')}</p>
          <p className="text-lg font-semibold text-foreground">{chf(summary.totalPauschalAbzug)}</p>
        </Card>
        <Card className="p-4 border-primary/30 bg-primary/5">
          <p className="text-xs text-muted-foreground mb-1">{t('taxableIncome')}</p>
          <p className="text-lg font-semibold text-primary">{chf(summary.totalTaxableIncome)}</p>
        </Card>
      </div>

      {/* Method comparison */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-medium text-sm">{t('methodComparison')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={`rounded-lg p-3 border-2 ${summary.totalTaxableIncomePauschal <= summary.totalTaxableIncomeEffektiv ? 'border-green-500 bg-green-50' : 'border-border'}`}>
            <div className="flex items-center gap-2 mb-1">
              {summary.totalTaxableIncomePauschal <= summary.totalTaxableIncomeEffektiv
                ? <CheckCircle className="h-4 w-4 text-green-600" />
                : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm font-medium">{t('flatDeduction')}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('deduction')}: {chf(summary.totalPauschalAbzug)}</p>
            <p className="text-base font-semibold">{chf(summary.totalTaxableIncomePauschal)}</p>
          </div>
          <div className={`rounded-lg p-3 border-2 ${summary.totalTaxableIncomeEffektiv < summary.totalTaxableIncomePauschal ? 'border-green-500 bg-green-50' : 'border-border'}`}>
            <div className="flex items-center gap-2 mb-1">
              {summary.totalTaxableIncomeEffektiv < summary.totalTaxableIncomePauschal
                ? <CheckCircle className="h-4 w-4 text-green-600" />
                : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm font-medium">{t('effectiveCosts')}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('costs')}: {chf(summary.totalRepairCosts)}</p>
            <p className="text-base font-semibold">{chf(summary.totalTaxableIncomeEffektiv)}</p>
          </div>
        </div>
      </Card>

      {/* Per property */}
      {summary.properties.map(prop => (
        <Card key={prop.propertyId} className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <h2 className="font-medium text-foreground">{prop.propertyName}</h2>
                <p className="text-xs text-muted-foreground">{prop.propertyAddress}</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${prop.recommendation === 'pauschal' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
              {prop.recommendation === 'pauschal' ? t('flatLabel', { rate: prop.pauschalRate }) : t('effectiveCosts')}
            </span>
          </div>

          {/* Income breakdown */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('coldRent')}</p>
              <p className="font-medium">{chf(prop.grossRentalIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('extraCosts')}</p>
              <p className="font-medium">{chf(prop.extraCostsIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('totalIncome')}</p>
              <p className="font-semibold">{chf(prop.totalIncome)}</p>
            </div>
            {prop.repairCosts > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">{t('maintenance')}</p>
                <p className="font-medium text-orange-600">– {chf(prop.repairCosts)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">{t('flatDeductionRate', { rate: prop.pauschalRate })}</p>
              <p className="font-medium">– {chf(prop.pauschalAbzug)}</p>
            </div>
            <div className="bg-primary/5 rounded p-2">
              <p className="text-xs text-muted-foreground">{t('taxableIncome')}</p>
              <p className="font-semibold text-primary">{chf(prop.taxableIncome)}</p>
            </div>
          </div>

          {/* Units table */}
          {prop.units.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">{t('colUnit')}</th>
                    <th className="text-left px-3 py-2 font-medium">{t('colTenant')}</th>
                    <th className="text-right px-3 py-2 font-medium">{t('colMonths')}</th>
                    <th className="text-right px-3 py-2 font-medium">{t('colRent')}</th>
                    <th className="text-right px-3 py-2 font-medium">{t('colExtra')}</th>
                    <th className="text-right px-3 py-2 font-medium">{t('colTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {prop.units.map((u, i) => (
                    <tr key={u.unitId} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                      <td className="px-3 py-2">{u.unitNumber}</td>
                      <td className="px-3 py-2 text-muted-foreground">{u.tenantName ?? '—'}</td>
                      <td className="px-3 py-2 text-right">{u.months}</td>
                      <td className="px-3 py-2 text-right">{chf(u.annualRent)}</td>
                      <td className="px-3 py-2 text-right">{chf(u.annualExtra)}</td>
                      <td className="px-3 py-2 text-right font-medium">{chf(u.annualRent + u.annualExtra)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {prop.buildingYear && (
            <p className="text-xs text-muted-foreground">
              {t('buildingInfo', { year: prop.buildingYear, age: summary.year - prop.buildingYear, rate: prop.pauschalRate })}
            </p>
          )}
        </Card>
      ))}

      {summary.properties.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <p>{t('noProperties')}</p>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">{t('disclaimer')}</p>
    </div>
  )
}
