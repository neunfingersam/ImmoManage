// app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  TrendingUp,
  Home,
  CreditCard,
  AlertCircle,
  CalendarClock,
  CheckSquare,
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { RevenueBarChart, type MonthlyRevenue } from './DashboardCharts'
import type { Priority, TaskType } from '@/lib/generated/prisma/enums'
import { getTranslations, getLocale } from 'next-intl/server'

type OpenTicket = {
  id: string
  title: string
  priority: Priority
  createdAt: Date
  property: { name: string }
}

type UpcomingTask = {
  id: string
  title: string
  dueDate: Date | null
  type: TaskType
}

const PRIORITY_CLASSES: Record<string, string> = {
  LOW:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  HIGH:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

async function getDashboardData(session: { user: { role: string; id: string; companyId: string | null } }) {
  const companyId = session.user.companyId!
  const isVermieter = session.user.role === 'VERMIETER'
  const propertyWhere = isVermieter
    ? { companyId, assignments: { some: { userId: session.user.id } } }
    : { companyId }

  const now = new Date()
  const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Revenue last 6 months (PAID demands)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    paidDemands,
    openPaymentsAgg,
    overdueCount,
    totalUnits,
    vacantUnits,
    openTickets,
    upcomingTasks,
    upcomingLeaseEnds,
    propertyCount,
    tenantCount,
  ] = await Promise.all([
    prisma.rentDemand.findMany({
      where: {
        companyId,
        status: 'PAID',
        OR: [
          { year: { gt: sixMonthsAgo.getFullYear() } },
          { year: sixMonthsAgo.getFullYear(), month: { gte: sixMonthsAgo.getMonth() + 1 } },
        ],
      },
      select: { year: true, month: true, amount: true },
    }),
    prisma.rentDemand.aggregate({
      where: { companyId, status: { in: ['PENDING', 'OVERDUE'] } },
      _sum: { amount: true },
    }),
    prisma.rentDemand.count({ where: { companyId, status: 'OVERDUE' } }),
    prisma.unit.count({ where: { property: { companyId } } }),
    prisma.unit.count({ where: { property: { companyId }, status: 'LEER' } }),
    prisma.ticket.findMany({
      where: isVermieter
        ? { companyId, status: 'OPEN', property: propertyWhere }
        : { companyId, status: 'OPEN' },
      select: {
        id: true,
        title: true,
        priority: true,
        createdAt: true,
        property: { select: { name: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: 4,
    }),
    prisma.task.findMany({
      where: {
        companyId,
        status: { not: 'ERLEDIGT' },
        dueDate: { lte: in7Days, gte: now },
      },
      select: { id: true, title: true, dueDate: true, type: true },
      orderBy: { dueDate: 'asc' },
      take: 4,
    }),
    prisma.lease.count({
      where: { companyId, status: 'ACTIVE', endDate: { lte: in60Days, gte: now } },
    }),
    prisma.property.count({ where: propertyWhere }),
    prisma.user.count({
      where: isVermieter
        ? { role: 'MIETER', companyId, leases: { some: { status: 'ACTIVE', unit: { property: propertyWhere } } } }
        : { role: 'MIETER', companyId },
    }),
  ])

  // Group revenue by month (last 6 months)
  const monthlyMap = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`
    monthlyMap.set(key, 0)
  }
  for (const d of paidDemands) {
    const key = `${d.year}-${d.month}`
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + d.amount)
    }
  }

  const revenueData: MonthlyRevenue[] = Array.from(monthlyMap.entries()).map(([key, amount]) => {
    const [y, m] = key.split('-').map(Number)
    const isCurrent = y === now.getFullYear() && m === now.getMonth() + 1
    const label = new Date(y, m - 1, 1).toLocaleDateString('de-CH', { month: 'short' })
    return { label, amount, isCurrent }
  })

  const currentMonthRevenue = revenueData.find((d) => d.isCurrent)?.amount ?? 0
  const occupancyRate = totalUnits > 0 ? Math.round(((totalUnits - vacantUnits) / totalUnits) * 100) : 0
  const openPayments = openPaymentsAgg._sum.amount ?? 0

  return {
    revenueData,
    currentMonthRevenue,
    occupancyRate,
    openPayments,
    overdueCount,
    openTickets,
    upcomingTasks,
    upcomingLeaseEnds,
    propertyCount,
    tenantCount,
    totalUnits,
    vacantUnits,
  }
}

function formatChf(amount: number) {
  return amount.toLocaleString('de-CH', { maximumFractionDigits: 0 })
}

function daysUntil(date: Date | null) {
  if (!date) return null
  const diff = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return diff
}

export default async function DashboardPage() {
  const [t, locale, session] = await Promise.all([
    getTranslations('dashboard'),
    getLocale(),
    getServerSession(authOptions),
  ])
  if (!session?.user?.companyId) return null

  const data = await getDashboardData(session)
  const firstName = session.user.name?.split(' ')[0] ?? 'Admin'

  const priorityLabels: Record<string, string> = {
    LOW: t('priorityLow'),
    MEDIUM: t('priorityMedium'),
    HIGH: t('priorityHigh'),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('greeting', { name: firstName })}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('subtitle')}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Einnahmen aktueller Monat */}
        <Link href={`/${locale}/dashboard/payments`}>
          <Card className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <div className="rounded-xl bg-primary/10 p-2.5 w-fit">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 text-2xl font-bold text-foreground">
              CHF {formatChf(data.currentMonthRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('revenueMonth')}</p>
          </Card>
        </Link>

        {/* Belegungsrate */}
        <Link href={`/${locale}/dashboard/properties`}>
          <Card className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer group relative overflow-hidden">
            {(() => {
              const isGood = data.occupancyRate >= 90
              const isOk = data.occupancyRate >= 75
              const iconColor = isGood ? '#16a34a' : isOk ? '#ca8a04' : '#dc2626'
              const bgColor = isGood ? 'rgba(22,163,74,0.1)' : isOk ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)'
              return (
                <>
                  <div className="rounded-xl p-2.5 w-fit" style={{ backgroundColor: bgColor }}>
                    <Home className="h-5 w-5" style={{ color: iconColor }} />
                  </div>
                  <p className="mt-4 text-2xl font-bold text-foreground">{data.occupancyRate}%</p>
                </>
              )
            })()}
            <p className="text-xs text-muted-foreground mt-1">
              {t('occupancy')} · {t('vacantCount', { count: data.vacantUnits })}
            </p>
          </Card>
        </Link>

        {/* Offene Posten */}
        <Link href={`/${locale}/dashboard/payments`}>
          <Card className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer group relative overflow-hidden">
            {data.openPayments > 0 && (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            )}
            <div className="flex items-start justify-between">
              <div className={`rounded-xl p-2.5 ${data.openPayments > 0 ? 'bg-amber-500/10' : 'bg-muted'}`}>
                <CreditCard className={`h-5 w-5 ${data.openPayments > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
              </div>
              {data.overdueCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {t('overdueLabel', { count: data.overdueCount })}
                </span>
              )}
            </div>
            <p className={`mt-4 text-2xl font-bold ${data.openPayments > 0 ? 'text-amber-600' : 'text-foreground'}`}>
              CHF {formatChf(data.openPayments)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('openItems')}</p>
          </Card>
        </Link>

        {/* Offene Tickets */}
        <Link href={`/${locale}/dashboard/tickets`}>
          <Card className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer group relative overflow-hidden">
            {data.openTickets.length > 0 && (
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
            )}
            <div className={`rounded-xl p-2.5 w-fit ${data.openTickets.length > 0 ? 'bg-red-500/10' : 'bg-muted'}`}>
              <AlertCircle className={`h-5 w-5 ${data.openTickets.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </div>
            <p className={`mt-4 text-2xl font-bold ${data.openTickets.length > 0 ? 'text-red-500' : 'text-foreground'}`}>
              {data.openTickets.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('openTicketsLabel')}</p>
          </Card>
        </Link>
      </div>

      {/* Charts + Stats row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('revenueChart')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t('revenueChartSubtitle')}</p>
            </div>
            <Link
              href={`/${locale}/dashboard/payments`}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {t('all')} <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <RevenueBarChart data={data.revenueData} />
        </Card>

        {/* Quick stats */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">{t('portfolio')}</h2>
          <div className="space-y-3">
            <StatRow label={t('propertiesLabel')} value={data.propertyCount} href={`/${locale}/dashboard/properties`} />
            <StatRow label={t('unitsTotal')} value={data.totalUnits} href={`/${locale}/dashboard/properties`} />
            <StatRow label={t('tenantsActive')} value={data.tenantCount} href={`/${locale}/dashboard/tenants`} />
            <div className="my-2 border-t border-border" />
            <StatRow
              label={t('leaseEnds60')}
              value={data.upcomingLeaseEnds}
              href={`/${locale}/dashboard/leases`}
              highlight={data.upcomingLeaseEnds > 0 ? 'amber' : undefined}
              icon={<CalendarClock className="h-3.5 w-3.5" />}
            />
          </div>
        </Card>
      </div>

      {/* Tickets + Tasks row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Open tickets */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">{t('openTicketsLabel')}</h2>
            <Link href={`/${locale}/dashboard/tickets`} className="text-xs text-primary hover:underline flex items-center gap-1">
              {t('all')} <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {data.openTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{t('noOpenTickets')}</p>
          ) : (
            <div className="space-y-2">
              {(data.openTickets as OpenTicket[]).map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/${locale}/dashboard/tickets/${ticket.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors group"
                >
                  <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {ticket.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{ticket.property.name}</p>
                  </div>
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 flex-shrink-0 ${PRIORITY_CLASSES[ticket.priority] ?? PRIORITY_CLASSES.MEDIUM}`}>
                    {priorityLabels[ticket.priority] ?? ticket.priority}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming tasks */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">{t('tasksWeek')}</h2>
            <Link href={`/${locale}/dashboard/tasks`} className="text-xs text-primary hover:underline flex items-center gap-1">
              {t('all')} <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {data.upcomingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{t('noTasks')}</p>
          ) : (
            <div className="space-y-2">
              {(data.upcomingTasks as UpcomingTask[]).map((task) => {
                const days = daysUntil(task.dueDate)
                return (
                  <Link
                    key={task.id}
                    href={`/${locale}/dashboard/tasks`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors group"
                  >
                    <CheckSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{task.type}</p>
                    </div>
                    {days !== null && (
                      <span
                        className={`text-xs font-medium rounded-full px-2 py-0.5 flex-shrink-0 ${
                          days <= 1
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : days <= 3
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {days === 0 ? t('today') : days === 1 ? t('tomorrow') : t('dAbbr', { n: days })}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  href,
  highlight,
  icon,
}: {
  label: string
  value: number
  href: string
  highlight?: 'amber' | 'red'
  icon?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-1 group"
    >
      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span
        className={`text-sm font-semibold ${
          highlight === 'amber'
            ? 'text-amber-600'
            : highlight === 'red'
            ? 'text-destructive'
            : 'text-foreground'
        } group-hover:text-primary transition-colors`}
      >
        {value}
      </span>
    </Link>
  )
}
