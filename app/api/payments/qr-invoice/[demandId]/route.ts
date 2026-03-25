import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildQrPayload, formatSwissIban } from '@/lib/qr-invoice'
import QRCode from 'qrcode'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ demandId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { demandId } = await params

  const demand = await prisma.rentDemand.findUnique({
    where: { id: demandId },
    include: {
      lease: {
        include: {
          tenant: { select: { name: true } },
          unit: { include: { property: true } },
        },
      },
      company: true,
    },
  })

  if (!demand || demand.companyId !== session.user.companyId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const company = demand.company
  // IBAN aus Company-Einstellungen (smtpConfig enthält auch bankIban für jetzt)
  const smtpConfig = company.smtpConfig as { bankIban?: string; bankName?: string } | null
  const iban = smtpConfig?.bankIban ?? 'CH0000000000000000000' // Demo-IBAN

  const monthStr = demand.month.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })
  const reference = `Miete ${monthStr} - ${demand.lease.tenant.name}`

  const qrPayload = buildQrPayload({
    iban,
    creditorName: company.name,
    creditorAddress: 'Musterstrasse 1', // TODO: Company-Adresse in DB
    creditorCity: '8001 Zürich',
    amount: demand.amount,
    currency: 'CHF',
    reference,
    debtorName: demand.lease.tenant.name,
  })

  // QR-Code als Data-URL generieren
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    width: 200,
  })

  return NextResponse.json({
    demandId,
    amount: demand.amount,
    currency: 'CHF',
    iban: formatSwissIban(iban),
    creditor: company.name,
    reference,
    dueDate: demand.dueDate.toISOString(),
    qrDataUrl,
    monthStr,
    tenantName: demand.lease.tenant.name,
  })
}
