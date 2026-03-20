// app/superadmin/page.tsx
import { prisma } from '@/lib/prisma'
import { TicketStatus } from '@/lib/generated/prisma'
import { Building, UserCog, Users, AlertCircle } from 'lucide-react'

export default async function SuperAdminPage() {
  const [companies, users, offeneTickets] = await Promise.all([
    prisma.company.count({ where: { active: true } }),
    prisma.user.count({ where: { active: true } }),
    prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
  ])

  const stats = [
    { label: 'Unternehmen', wert: companies, icon: Building },
    { label: 'Nutzer gesamt', wert: users, icon: Users },
    { label: 'Admins', wert: '—', icon: UserCog },
    { label: 'Offene Tickets', wert: offeneTickets, icon: AlertCircle },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Plattform-Übersicht</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle Unternehmen und Statistiken auf einen Blick.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-card bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                <stat.icon className="h-[18px] w-[18px] text-primary" />
              </div>
            </div>
            <p className="mt-3 font-serif text-2xl text-foreground">{stat.wert}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
