// app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Building2, Users, FileText, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'

async function getKpis(session: { user: { role: string; id: string; companyId: string | null } }) {
  const companyId = session.user.companyId!
  const isVermieter = session.user.role === 'VERMIETER'

  const propertyWhere = isVermieter
    ? { companyId, assignments: { some: { userId: session.user.id } } }
    : { companyId }

  const [properties, units, tenants, tickets] = await Promise.all([
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
  ])

  return { properties, units, tenants, tickets }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const kpi = await getKpis(session)

  const cards = [
    { label: 'Immobilien', value: kpi.properties, icon: Building2, href: '/dashboard/properties', color: 'text-primary' },
    { label: 'Einheiten', value: kpi.units, icon: FileText, href: '/dashboard/properties', color: 'text-secondary-foreground' },
    { label: 'Mieter', value: kpi.tenants, icon: Users, href: '/dashboard/tenants', color: 'text-foreground' },
    { label: 'Offene Tickets', value: kpi.tickets, icon: AlertCircle, href: '/dashboard/tickets', color: 'text-destructive' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Übersicht</p>
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
