import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { computeTaxSummary } from '@/lib/tax'
import { getTaxI18n } from '@/lib/tax-i18n'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { getPropertyWhere } from '@/lib/access-control'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear() - 1))
  const format = searchParams.get('format') // 'json' | 'pdf' | 'xlsx'
  const locale = searchParams.get('lang') ?? 'de'
  const i18n = getTaxI18n(locale)

  // Resolve which properties the current user may access (role-scoped for VERMIETER)
  const accessibleProperties = await prisma.property.findMany({
    where: getPropertyWhere(session),
    select: { id: true },
  })
  const propertyIds = accessibleProperties.map((p) => p.id)

  const summary = await computeTaxSummary(session.user.companyId, year, propertyIds)

  if (!format || format === 'json') {
    return NextResponse.json(summary)
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { name: true },
  })
  const companyName = company?.name ?? 'ImmoManage'

  if (format === 'pdf') {
    const { SteuerberichtPdf } = await import('@/lib/templates/steuerbericht')
    const buffer = await renderToBuffer(
      React.createElement(SteuerberichtPdf, { data: summary, companyName, i18n }) as any
    )
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${i18n.filename(year)}.pdf"`,
      },
    })
  }

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const summaryData = [
      [i18n.title, year],
      [i18n.createdBy, companyName],
      [],
      [i18n.totalIncome, summary.totalIncome],
      [i18n.repairCostsTotal, summary.totalRepairCosts],
      [i18n.flatDeductionTotal, summary.totalPauschalAbzug],
      [i18n.taxableIncomePauschal, summary.totalTaxableIncomePauschal],
      [i18n.taxableIncomeEffektiv, summary.totalTaxableIncomeEffektiv],
      [i18n.taxableIncomeRecommended, summary.totalTaxableIncome],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), i18n.sheetOverview)

    // Per-property sheet
    const detailHeaders = [i18n.colProperty, i18n.colUnit, i18n.colTenant, i18n.colMonths, i18n.colRent, i18n.colExtra, i18n.colTotal]
    const detailRows: (string | number)[][] = [detailHeaders]
    for (const prop of summary.properties) {
      for (const u of prop.units) {
        detailRows.push([
          prop.propertyName,
          u.unitNumber,
          u.tenantName ?? '—',
          u.months,
          u.annualRent,
          u.annualExtra,
          u.annualRent + u.annualExtra,
        ])
      }
      detailRows.push([i18n.rowTotal(prop.propertyName), '', '', '', prop.grossRentalIncome, prop.extraCostsIncome, prop.totalIncome])
      detailRows.push([])
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detailRows), i18n.sheetIncome)

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${i18n.filename(year)}.xlsx"`,
      },
    })
  }

  return NextResponse.json({ error: 'Unknown format' }, { status: 400 })
}
