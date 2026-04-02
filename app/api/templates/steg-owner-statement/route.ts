import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { StegOwnerStatementPDF } from '@/lib/templates/steg-jahresabrechnung'
import React from 'react'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const statementId = new URL(req.url).searchParams.get('statementId')
  if (!statementId) return new NextResponse('statementId required', { status: 400 })

  const stmt = await prisma.stegOwnerStatement.findFirst({
    where: { id: statementId },
    include: {
      owner: {
        include: {
          user: { select: { name: true } },
          property: true,
        },
      },
      jahresabrechnung: {
        include: {
          property: true,
          ownerStatements: { select: { owner: { select: { mea: true } } } },
        },
      },
    },
  })
  if (!stmt) return new NextResponse('Not found', { status: 404 })

  // Verify company access
  if (stmt.jahresabrechnung.property.companyId !== session.user.companyId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const ja = stmt.jahresabrechnung
  const property = ja.property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalMea = ja.ownerStatements.reduce((s: number, os: any) => s + (os.owner.mea ?? 0), 0)

  // Budget positionen laden für detaillierte Aufschlüsselung
  const budget = await prisma.stegBudget.findUnique({
    where: { propertyId_jahr: { propertyId: property.id, jahr: ja.jahr } },
    include: { positionen: true },
  })

  const meaAnteil = totalMea > 0 ? (stmt.owner.mea ?? 0) / totalMea : 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const positionen = (budget?.positionen ?? []).map((pos: any) => ({
    kategorie: pos.kategorie,
    beschreibung: pos.beschreibung,
    budgetBetrag: pos.budgetBetrag,
    istBetrag: pos.istBetrag,
    ownerAnteil: pos.istBetrag * meaAnteil,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(StegOwnerStatementPDF, {
      data: {
        propertyName: property.name,
        propertyAddress: property.address,
        ownerName: stmt.owner.user.name ?? 'Unbekannt',
        jahr: ja.jahr,
        mea: stmt.owner.mea ?? 0,
        totalMea,
        kostenanteil: stmt.kostenanteil,
        fondsanteil: stmt.fondsanteil,
        vorauszahlungen: stmt.vorauszahlungen,
        saldo: stmt.saldo,
        positionen,
      },
    }) as any,
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="jahresabrechnung-${ja.jahr}-${stmt.owner.user.name?.replace(/\s+/g, '-')}.pdf"`,
    },
  })
}
