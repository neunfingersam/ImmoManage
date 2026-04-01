import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { HauswartRapportPDF } from '@/lib/templates/hauswart-rapport'
import React from 'react'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const propertyId = searchParams.get('propertyId')
  const monat = parseInt(searchParams.get('monat') ?? '1')
  const jahr = parseInt(searchParams.get('jahr') ?? String(new Date().getFullYear()))

  if (!propertyId) return new NextResponse('propertyId required', { status: 400 })

  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId: session.user.companyId },
    include: { wegConfig: true },
  })
  if (!property) return new NextResponse('Not found', { status: 404 })

  const from = new Date(jahr, monat - 1, 1)
  const to = new Date(jahr, monat, 1)

  const entries = await prisma.hauswartEntry.findMany({
    where: { propertyId, companyId: session.user.companyId, datum: { gte: from, lt: to } },
    orderBy: { datum: 'asc' },
  })

  const stundenansatz = property.wegConfig?.hauswartStundenansatz ?? 45
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stunden = entries.filter((e: any) => e.kategorie === 'STUNDEN').reduce((s: number, e: any) => s + (e.stunden ?? 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auslagen = entries.filter((e: any) => e.kategorie !== 'STUNDEN').reduce((s: number, e: any) => s + (e.betrag ?? 0), 0)
  const stundenkosten = stunden * stundenansatz

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(HauswartRapportPDF, {
      data: {
        propertyName: property.name,
        propertyAddress: property.address,
        monat, jahr, stundenansatz,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        entries: entries.map((e: any) => ({
          datum: new Date(e.datum).toLocaleDateString('de-CH'),
          kategorie: e.kategorie,
          beschreibung: e.beschreibung,
          stunden: e.stunden,
          betrag: e.betrag,
        })),
        totals: { stunden, stundenkosten, auslagen, total: stundenkosten + auslagen },
      },
    }) as any
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="hauswart-rapport-${jahr}-${String(monat).padStart(2,'0')}.pdf"`,
    },
  })
}
