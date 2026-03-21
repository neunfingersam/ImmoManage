import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return new Response('Nicht autorisiert', { status: 401 })
  }

  const companyId = session.user.companyId

  const tenants = await prisma.user.findMany({
    where: { companyId, role: 'MIETER', active: true },
    select: {
      name: true,
      email: true,
      phone: true,
      leases: {
        where: { status: 'ACTIVE', companyId },
        include: {
          unit: { include: { property: { select: { name: true } } } },
        },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  })

  const rows = tenants.map(t => {
    const lease = t.leases[0]
    return {
      Name: t.name,
      Email: t.email,
      Telefon: t.phone ?? '',
      Einheit: lease?.unit.unitNumber ?? '',
      Immobilie: lease?.unit.property.name ?? '',
      'Kaltmiete (€)': lease?.coldRent ?? '',
      'Nebenkosten (€)': lease?.extraCosts ?? '',
      'Warmmiete (€)': lease ? lease.coldRent + lease.extraCosts : '',
      Mietbeginn: lease ? new Date(lease.startDate).toLocaleDateString('de-DE') : '',
      Status: lease ? 'Aktiv' : 'Kein Vertrag',
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Mieterliste')

  // Column widths
  ws['!cols'] = [
    { wch: 25 }, { wch: 30 }, { wch: 18 }, { wch: 12 },
    { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 15 },
  ]

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Mieterliste.xlsx"',
    },
  })
}
