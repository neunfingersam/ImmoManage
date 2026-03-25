import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'

const TEMPLATE_TYPES = ['mietvertrag', 'uebergabeprotokoll', 'kuendigung', 'mahnung1', 'mahnung2', 'mahnung3'] as const
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
  const propertyAddress = tenantData?.leases[0]?.unit.property.address ?? '[Objekt Adresse]'
  const coldRent = tenantData?.leases[0]?.coldRent ?? 0
  const extraCosts = tenantData?.leases[0]?.extraCosts ?? 0

  let pdfBuffer: Buffer

  if (type.startsWith('mahnung')) {
    const level = parseInt(type.replace('mahnung', '')) as 1 | 2 | 3
    const { MahnungPdf } = await import('@/lib/templates/mahnung')

    pdfBuffer = await renderToBuffer(
      React.createElement(MahnungPdf, {
        companyName,
        tenantName,
        tenantAddress: '[Mieter Adresse]',
        propertyAddress,
        month: new Date().toLocaleDateString(locale === 'de' ? 'de-CH' : locale, { month: 'long', year: 'numeric' }),
        amount: coldRent + extraCosts,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('de-CH'),
        level,
        locale,
      })
    )
  } else {
    const { SimplePlaceholderPdf } = await import('@/lib/templates/placeholder')

    pdfBuffer = await renderToBuffer(
      React.createElement(SimplePlaceholderPdf, {
        companyName,
        type,
        locale,
        tenantName,
        propertyAddress,
      })
    )
  }

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${type}-${locale}.pdf"`,
    },
  })
}
