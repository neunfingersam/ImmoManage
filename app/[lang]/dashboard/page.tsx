// app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Building2, Users, FileText, AlertCircle, CreditCard, TriangleAlert, CheckSquare, Home, CalendarClock } from 'lucide-react'
import { Card } from '@/components/ui/card'

async function getKpis(session: { user: { role: string; id: string; companyId: string | null } }) {
  const companyId = session.user.companyId!
  const isVermieter = session.user.role === 'VERMIETER'

  const propertyWhere = isVermieter
    ? { companyId, assignments: { some: { userId: session.user.id } } }
    : { companyId }

  const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

  const [
    properties,
    units,
    tenants,
    tickets,
    openPaymentsTotal,
    overdueCount,
    totalUnits,
    vacantUnits,
    upcomingLeaseEnds,
    tasks7,
    tasks30,
  ] = await Promise.all([
    prisma.property.count({ where: propertyWhere }),
    prisma.unit.count({ where: { property: propertyWhere } }),
    prisma.user.count({
      where: isVermieter
        ? {
            role: 'MIETER',
            companyId,
            leases: {
              some: {
                status: 'ACTIVE',
                unit: { property: propertyWhere },
              },
            },
          }
        : { role: 'MIETER', companyId },
    }),
    prisma.ticket.count({
      where: isVermieter
        ? { companyId, status: 'OPEN', property: propertyWhere }
        : { companyId, status: 'OPEN' },
    }),
    prisma.rentDemand.aggregate({
      where: { companyId, status: { in: ['PENDING', 'OVERDUE'] } },
      _sum: { amount: true },
    }),
    prisma.rentDemand.count({
      where: { companyId, status: 'OVERDUE' },
    }),
    prisma.unit.count({ where: { property: { companyId } } }),
    prisma.unit.count({ where: { property: { companyId }, status: 'LEER' } }),
    prisma.lease.count({
      where: {
        companyId,
        status: 'ACTIVE',
        endDate: { lte: in60Days, gte: new Date() },
      },
    }),
    prisma.task.count({
      where: {
        companyId,
        status: { not: 'ERLEDIGT' },
        dueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.task.count({
      where: {
        companyId,
        status: { not: 'ERLEDIGT' },
        dueDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  const vacancyRate = totalUnits > 0 ? Math.round((vacantUnits / totalUnits) * 100) : 0

  return {
    properties,
    units,
    tenants,
    tickets,
    openPaymentsTotal: openPaymentsTotal._sum.amount ?? 0,
    overdueCount,
    vacancyRate,
    vacantUnits,
    upcomingLeaseEnds,
    tasks7,
    tasks30,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const kpi = await getKpis(session)

  const vacancyColor =
    kpi.vacancyRate < 5
      ? 'text-green-600'
      : kpi.vacancyRate < 15
        ? 'text-yellow-600'
        : 'text-destructive'

  const cards = [
    { label: 'Immobilien', value: kpi.properties, icon: Building2, href: '/dashboard/properties', color: 'text-primary' },
    { label: 'Einheiten', value: kpi.units, icon: FileText, href: '/dashboard/properties', color: 'text-secondary-foreground' },
    { label: 'Mieter', value: kpi.tenants, icon: Users, href: '/dashboard/tenants', color: 'text-foreground' },
    { label: 'Offene Tickets', value: kpi.tickets, icon: AlertCircle, href: '/dashboard/tickets', color: 'text-destructive' },
    { label: 'Offene Posten (CHF)', value: `${kpi.openPaymentsTotal.toFixed(0)}`, icon: CreditCard, href: '/dashboard/payments', color: 'text-primary' },
    { label: 'Überfällig', value: kpi.overdueCount, icon: TriangleAlert, href: '/dashboard/payments', color: 'text-destructive' },
    { label: 'Leerstandsquote', value: `${kpi.vacancyRate}%`, icon: Home, href: '/dashboard/properties', color: vacancyColor },
    { label: 'Vertragsenden (60d)', value: kpi.upcomingLeaseEnds, icon: CalendarClock, href: '/dashboard/leases', color: kpi.upcomingLeaseEnds > 0 ? 'text-yellow-600' : 'text-foreground' },
    { label: 'Aufgaben (7 Tage)', value: kpi.tasks7, icon: CheckSquare, href: '/dashboard/tasks', color: kpi.tasks7 > 0 ? 'text-destructive' : 'text-foreground' },
    { label: 'Aufgaben (30 Tage)', value: kpi.tasks30, icon: CheckSquare, href: '/dashboard/tasks', color: 'text-muted-foreground' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Übersicht</h1>
        <p className="text-sm text-muted-foreground mt-1">Willkommen, {session?.user?.name?.split(' ')[0]}!</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow cursor-pointer">
              <div className={`rounded-card bg-muted p-2.5 ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
                <p className="text-sm text-muted-foreground">{c.label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
