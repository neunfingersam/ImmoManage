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
  ArrowUpRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { RevenueBarChart, type MonthlyRevenue } from './DashboardCharts'
import type { Priority, TaskType } from '@/lib/generated/prisma/enums'

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

const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

const PRIORITY_STYLES: Record<string, { label: string; class: string }> = {
  LOW:    { label: 'Niedrig',  class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  MEDIUM: { label: 'Mittel',   class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  HIGH:   { label: 'Hoch',     class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
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
    return { label: MONTH_LABELS[m - 1], amount, isCurrent }
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
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const data = await getDashboardData(session)
  const firstName = session.user.name?.split(' ')[0] ?? 'Admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Guten Tag, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Hier ist eine Übersicht deiner Verwaltung</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Einnahmen aktueller Monat */}
        <Link href="/dashboard/payments">
          <Card className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
            <p className="mt-4 text-2xl font-bold text-foreground">
              CHF {formatChf(data.currentMonthRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Einnahmen diesen Monat</p>
          </Card>
        </Link>

        {/* Belegungsrate */}
        <Link href="/dashboard/properties">
          <Card className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer group relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  data.occupancyRate >= 90
                    ? 'linear-gradient(135deg, rgb(22 163 74 / 0.06), transparent)'
                    : data.occupancyRate >= 75
                    ? 'linear-gradient(135deg, rgb(234 179 8 / 0.06), transparent)'
                    : 'linear-gradient(135deg, rgb(239 68 68 / 0.06), transparent)',
              }}
            />
            <div className="flex items-start justify-between">
              <div
                className="rounded-xl p-2.5"
                style={{
                  backgroundColor:
                    data.occupancyRate >= 90
                      ? 'rgb(22 163 74 / 0.12)'
                      : data.occupancyRate >= 75
                      ? 'rgb(234 179 8 / 0.12)'
                      : 'rgb(239 68 68 / 0.12)',
                }}
              >
                <Home
                  className="h-5 w-5"
                  style={{
                    color:
                      data.occupancyRate >= 90
                        ? 'rgb(22 163 74)'
                        : data.occupancyRate >= 75
                        ? 'rgb(202 138 4)'
                        : 'rgb(220 38 38)',
                  }}
                />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
            <p className="mt-4 text-2xl font-bold text-foreground">{data.occupancyRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Belegungsrate · {data.vacantUnits} leer
            </p>
          </Card>
        </Link>

        {/* Offene Posten */}
        <Link href="/dashboard/payments">
          <Card className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer group relative overflow-hidden">
            {data.openPayments > 0 && (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            )}
            <div className="flex items-start justify-between">
              <div className={`rounded-xl p-2.5 ${data.openPayments > 0 ? 'bg-amber-500/10' : 'bg-muted'}`}>
                <CreditCard className={`h-5 w-5 ${data.openPayments > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
              </div>
              {data.overdueCount > 0 && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                  {data.overdueCount} überfällig
                </span>
              )}
            </div>
            <p className={`mt-4 text-2xl font-bold ${data.openPayments > 0 ? 'text-amber-600' : 'text-foreground'}`}>
              CHF {formatChf(data.openPayments)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Offene Posten</p>
          </Card>
        </Link>

        {/* Offene Tickets */}
        <Link href="/dashboard/tickets">
          <Card className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer group relative overflow-hidden">
            {data.openTickets.length > 0 && (
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
            )}
            <div className="flex items-start justify-between">
              <div className={`rounded-xl p-2.5 ${data.openTickets.length > 0 ? 'bg-red-500/10' : 'bg-muted'}`}>
                <AlertCircle className={`h-5 w-5 ${data.openTickets.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
            <p className={`mt-4 text-2xl font-bold ${data.openTickets.length > 0 ? 'text-red-500' : 'text-foreground'}`}>
              {data.openTickets.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Offene Tickets</p>
          </Card>
        </Link>
      </div>

      {/* Charts + Stats row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Mieteinnahmen</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Letzte 6 Monate (bezahlt)</p>
            </div>
            <Link
              href="/dashboard/payments"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Alle <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <RevenueBarChart data={data.revenueData} />
        </Card>

        {/* Quick stats */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Bestand</h2>
          <div className="space-y-3">
            <StatRow label="Immobilien" value={data.propertyCount} href="/dashboard/properties" />
            <StatRow label="Einheiten total" value={data.totalUnits} href="/dashboard/properties" />
            <StatRow label="Mieter aktiv" value={data.tenantCount} href="/dashboard/tenants" />
            <div className="my-2 border-t border-border" />
            <StatRow
              label="Vertragsenden (60 Tage)"
              value={data.upcomingLeaseEnds}
              href="/dashboard/leases"
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
            <h2 className="text-sm font-semibold text-foreground">Offene Tickets</h2>
            <Link href="/dashboard/tickets" className="text-xs text-primary hover:underline flex items-center gap-1">
              Alle <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {data.openTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Keine offenen Tickets</p>
          ) : (
            <div className="space-y-2">
              {(data.openTickets as OpenTicket[]).map((ticket) => {
                const p = PRIORITY_STYLES[ticket.priority] ?? PRIORITY_STYLES.MEDIUM
                return (
                  <Link
                    key={ticket.id}
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors group"
                  >
                    <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{ticket.property.name}</p>
                    </div>
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 flex-shrink-0 ${p.class}`}>
                      {p.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </Card>

        {/* Upcoming tasks */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Aufgaben (nächste 7 Tage)</h2>
            <Link href="/dashboard/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
              Alle <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {data.upcomingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Keine fälligen Aufgaben</p>
          ) : (
            <div className="space-y-2">
              {(data.upcomingTasks as UpcomingTask[]).map((task) => {
                const days = daysUntil(task.dueDate)
                return (
                  <Link
                    key={task.id}
                    href="/dashboard/tasks"
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
                        {days === 0 ? 'Heute' : days === 1 ? 'Morgen' : `${days}d`}
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
