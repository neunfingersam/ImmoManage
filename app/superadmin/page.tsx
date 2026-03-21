// app/superadmin/page.tsx
import { prisma } from '@/lib/prisma'
import { TicketStatus, Role } from '@/lib/generated/prisma'
import { Building, Home, Users, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ReindexButton } from './ReindexButton'

export default async function SuperAdminPage() {
  const [companies, vermieter, mieter, openTickets] = await Promise.all([
    prisma.company.count(),
    prisma.user.count({ where: { role: Role.VERMIETER } }),
    prisma.user.count({ where: { role: Role.MIETER } }),
    prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
  ])

  const stats = [
    { label: 'Companies', value: companies, icon: Building },
    { label: 'Vermieter', value: vermieter, icon: Home },
    { label: 'Mieter', value: mieter, icon: Users },
    { label: 'Offene Tickets', value: openTickets, icon: AlertCircle },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Plattform-Übersicht</h1>
        <p className="text-sm text-muted-foreground mt-1">Super Admin Dashboard</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <Card key={s.label} className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary shrink-0">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-serif text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>
      <div>
        <h2 className="font-serif text-lg text-foreground mb-1">KI-Suche</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Dokumente neu indexieren, um die KI-Suche auf den aktuellen Stand zu bringen.
        </p>
        <ReindexButton />
      </div>
    </div>
  )
}
