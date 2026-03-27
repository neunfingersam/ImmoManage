import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const [user, leases, tickets, messages, meterReadings, documents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        iban: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.lease.findMany({
      where: { tenantId: userId },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        coldRent: true,
        extraCosts: true,
        status: true,
        unit: { select: { unitNumber: true, property: { select: { name: true, address: true } } } },
      },
    }),
    prisma.ticket.findMany({
      where: { tenantId: userId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    }),
    prisma.message.findMany({
      where: { fromId: userId },
      select: {
        id: true,
        text: true,
        createdAt: true,
        to: { select: { name: true } },
      },
    }),
    prisma.meterReading.findMany({
      where: { tenantId: userId },
      select: {
        id: true,
        type: true,
        value: true,
        unit: true,
        readingDate: true,
      },
    }),
    prisma.document.findMany({
      where: { tenantId: userId },
      select: {
        id: true,
        name: true,
        category: true,
        createdAt: true,
      },
    }),
  ])

  const exportData = {
    exportedAt: new Date().toISOString(),
    notice: 'Dieser Datenexport wurde gemäss Art. 20 DSGVO / Art. 28 DSG erstellt.',
    profile: user,
    leases,
    tickets,
    sentMessages: messages,
    meterReadings,
    documents,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="immo-manage-daten-${userId}.json"`,
    },
  })
}
