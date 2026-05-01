// app/[lang]/dashboard/payments/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RentDemandTable } from '@/components/payments/RentDemandTable'
import { CamtImport } from '@/components/payments/CamtImport'
import { Button } from '@/components/ui/button'
import { getTranslations } from 'next-intl/server'

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const t = await getTranslations('payments')
  const companyId = session.user.companyId

  const demands = await prisma.rentDemand.findMany({
    where: { companyId },
    include: {
      lease: {
        include: {
          tenant: { select: { name: true } },
          unit: { include: { property: { select: { name: true } } } },
        },
      },
      reminders: { orderBy: { level: 'desc' }, take: 1 },
    },
    orderBy: { month: 'desc' },
  })

  const openTotal = demands
    .filter((d) => d.status !== 'PAID')
    .reduce((sum, d) => sum + d.amount, 0)
  const overdueCount = demands.filter((d) => d.status === 'OVERDUE').length

  const rows = demands.map((d) => ({
    id: d.id,
    month: new Date(d.year, d.month - 1, 1),
    amount: d.amount,
    status: d.status as 'PENDING' | 'PAID' | 'OVERDUE',
    dueDate: d.dueDate,
    tenantName: d.lease.tenant.name,
    unitNumber: d.lease.unit.unitNumber,
    propertyName: d.lease.unit.property.name,
    reminderLevel: d.reminders[0]?.level ?? 0,
  }))

  type Row = typeof rows[number]
  const openDemands = rows
    .filter((r: Row) => r.status !== 'PAID')
    .map((r: Row) => ({
      id: r.id,
      tenantName: r.tenantName,
      propertyName: r.propertyName,
      unitNumber: r.unitNumber,
      amount: r.amount,
      month: r.month,
    }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-foreground">{t('title')}</h1>
        <form action="/api/payments/generate-demands" method="POST">
          <Button type="submit">{t('generateDemands')}</Button>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">{t('openTotal')}</p>
          <p className="text-2xl font-bold">CHF {openTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">{t('overdueCount')}</p>
          <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
        </div>
      </div>

      {/* CAMT Import */}
      {openDemands.length > 0 && (
        <div className="rounded-xl border p-5 space-y-3">
          <div>
            <p className="font-medium text-sm">{t('camtTitle')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('camtDesc')}</p>
          </div>
          <CamtImport openDemands={openDemands} />
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-muted-foreground">{t('empty', { btn: t('generateDemands') })}</p>
      ) : (
        <RentDemandTable demands={rows} />
      )}
    </div>
  )
}
