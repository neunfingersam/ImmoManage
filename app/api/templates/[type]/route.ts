import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'

const TEMPLATE_TYPES = [
  'mietvertrag',
  'uebergabeprotokoll',
  'kuendigung',
  'nebenkostenabrechnung',
  'mahnung1',
  'mahnung2',
  'mahnung3',
] as const
type TemplateType = (typeof TEMPLATE_TYPES)[number]

export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type } = await params
  const url = new URL(req.url)
  const locale = url.searchParams.get('locale') ?? 'de'
  const tenantId = url.searchParams.get('tenantId')

  if (!TEMPLATE_TYPES.includes(type as TemplateType)) {
    return NextResponse.json({ error: 'Unbekannter Template-Typ' }, { status: 400 })
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { name: true },
  })

  let tenantData = null
  if (tenantId) {
    tenantData = await prisma.user.findUnique({
      where: { id: tenantId },
      include: {
        leases: {
          where: { status: 'ACTIVE' },
          include: { unit: { include: { property: true } } },
          take: 1,
        },
      },
    })
  }

  const companyName = company?.name ?? 'ImmoManage'
  const tenantName = tenantData?.name ?? '[Mieter Name]'
  const tenantAddress = tenantData?.leases[0]?.unit.property.address ?? '[Mieter Adresse]'
  const propertyAddress = tenantData?.leases[0]?.unit.property.address ?? '[Objekt Adresse]'
  const unitNumber = tenantData?.leases[0]?.unit.unitNumber ?? '[Einheit]'
  const coldRent = tenantData?.leases[0]?.coldRent ?? 0
  const extraCosts = tenantData?.leases[0]?.extraCosts ?? 0
  const startDate = tenantData?.leases[0]?.startDate?.toISOString() ?? new Date().toISOString()
  const endDate = tenantData?.leases[0]?.endDate?.toISOString() ?? null
  const landlordName = session.user.name ?? companyName

  let pdfBuffer: Buffer

  if (type.startsWith('mahnung')) {
    const level = parseInt(type.replace('mahnung', '')) as 1 | 2 | 3
    const { MahnungPdf } = await import('@/lib/templates/mahnung')
    pdfBuffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(MahnungPdf, {
        companyName,
        tenantName,
        tenantAddress,
        propertyAddress,
        month: new Date().toLocaleDateString(locale === 'de' ? 'de-CH' : locale === 'fr' ? 'fr-CH' : locale === 'it' ? 'it-CH' : 'en-GB', { month: 'long', year: 'numeric' }),
        amount: coldRent + extraCosts,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('de-CH'),
        level,
        locale,
      }) as any
    )
  } else if (type === 'mietvertrag') {
    const { MietvertragPdf } = await import('@/lib/templates/mietvertrag')
    pdfBuffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(MietvertragPdf, {
        locale,
        companyName,
        landlordName,
        landlordAddress: companyName,
        tenantName,
        tenantAddress,
        propertyAddress,
        unitNumber,
        floor: tenantData?.leases[0]?.unit.floor ?? null,
        rooms: tenantData?.leases[0]?.unit.rooms ?? null,
        size: tenantData?.leases[0]?.unit.size ?? null,
        startDate,
        endDate,
        coldRent,
        extraCosts,
        depositAmount: coldRent > 0 ? coldRent * 3 : null,
        depositBank: null,
        referenzzinssatz: 1.75,
        indexierung: false,
      }) as any
    )
  } else if (type === 'uebergabeprotokoll') {
    const { UebergabeprotokollPdf } = await import('@/lib/templates/uebergabeprotokoll')
    pdfBuffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(UebergabeprotokollPdf, {
        locale,
        companyName,
        landlordName,
        tenantName,
        tenantAddress,
        propertyAddress,
        unitNumber,
        floor: tenantData?.leases[0]?.unit.floor ?? null,
        rooms: tenantData?.leases[0]?.unit.rooms ?? null,
        handoverDate: new Date().toISOString(),
        handoverType: 'auszug',
        keyCount: 2,
        mailboxKeyCount: 1,
      }) as any
    )
  } else if (type === 'kuendigung') {
    const { KuendigungPdf } = await import('@/lib/templates/kuendigung')
    // Compute next Termin (31 March or 30 September, min 3 months from today)
    const today = new Date()
    const minDate = new Date(today)
    minDate.setMonth(minDate.getMonth() + 3)
    let terminMonth = minDate.getMonth() < 3 ? 2 : minDate.getMonth() < 9 ? 8 : 2
    let terminYear = terminMonth === 2 && minDate.getMonth() >= 9 ? minDate.getFullYear() + 1 : minDate.getFullYear()
    if (terminMonth === 2 && minDate.getFullYear() > today.getFullYear()) terminYear = minDate.getFullYear()
    const terminDay = terminMonth === 2 ? 31 : 30
    const terminDate = new Date(terminYear, terminMonth, terminDay)
    pdfBuffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(KuendigungPdf, {
        locale,
        companyName,
        direction: 'vermieter',
        landlordName,
        landlordAddress: companyName,
        tenantName,
        tenantAddress,
        propertyAddress,
        unitNumber,
        noticeDate: today.toISOString(),
        terminationDate: terminDate.toISOString(),
        reason: null,
        referenzzinssatz: 1.75,
      }) as any
    )
  } else if (type === 'nebenkostenabrechnung') {
    const { NebenkostenabrechnungPdf } = await import('@/lib/templates/nebenkostenabrechnung')
    const year = new Date().getFullYear() - 1
    const defaultPositions = [
      { label: 'Heizung / Brennstoff', totalCost: 3200, sharePercent: 25, tenantAmount: 800 },
      { label: 'Warmwasser', totalCost: 1200, sharePercent: 25, tenantAmount: 300 },
      { label: 'Allgemeinstrom', totalCost: 480, sharePercent: 25, tenantAmount: 120 },
      { label: 'Hauswart (anteilig)', totalCost: 2400, sharePercent: 25, tenantAmount: 600 },
      { label: 'Kehrichtabfuhr', totalCost: 320, sharePercent: 25, tenantAmount: 80 },
      { label: 'Lift (Wartung/Strom)', totalCost: 600, sharePercent: 25, tenantAmount: 150 },
      { label: 'Versicherungen (Gebäude)', totalCost: 800, sharePercent: 25, tenantAmount: 200 },
    ]
    const totalTenantCosts = defaultPositions.reduce((s, p) => s + p.tenantAmount, 0)
    pdfBuffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(NebenkostenabrechnungPdf, {
        locale,
        companyName,
        landlordName,
        tenantName,
        tenantAddress,
        propertyAddress,
        unitNumber,
        periodStart: `${year}-01-01`,
        periodEnd: `${year}-12-31`,
        positions: defaultPositions,
        totalAkontozahlungen: extraCosts > 0 ? extraCosts * 12 : totalTenantCosts - 60,
      }) as any
    )
  } else {
    const { SimplePlaceholderPdf } = await import('@/lib/templates/placeholder')
    pdfBuffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(SimplePlaceholderPdf, {
        companyName,
        type,
        locale,
        tenantName,
        propertyAddress,
      }) as any
    )
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${type}-${locale}.pdf"`,
    },
  })
}
