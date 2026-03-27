// app/superadmin/page.tsx
import { prisma } from '@/lib/prisma'
import { TicketStatus, Role } from '@/lib/generated/prisma'
import { Building, Users, AlertCircle, UserCog, Home, UserCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ReindexButton } from './ReindexButton'

export default async function SuperAdminPage() {
  const [companies, admins, vermieter, mieter, openTickets] = await Promise.all([
    prisma.company.count(),
    prisma.user.count({ where: { role: Role.ADMIN } }),
    prisma.user.count({ where: { role: Role.VERMIETER } }),
    prisma.user.count({ where: { role: Role.MIETER } }),
    prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
  ])

  const totalUsers = admins + vermieter + mieter

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Plattform-Übersicht</h1>
        <p className="text-sm text-muted-foreground mt-1">Super Admin Dashboard</p>
      </div>

      {/* Row 1: Companies + Tickets */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary shrink-0">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-serif text-foreground">{companies}</p>
            <p className="text-xs text-muted-foreground">Companies</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-serif text-foreground">{openTickets}</p>
            <p className="text-xs text-muted-foreground">Offene Tickets</p>
          </div>
        </Card>
      </div>

      {/* Row 2: Users breakdown */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Nutzer</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Nutzer', value: totalUsers, icon: Users, highlight: true },
            { label: 'Admins', value: admins, icon: UserCog },
            { label: 'Vermieter', value: vermieter, icon: UserCheck },
            { label: 'Mieter', value: mieter, icon: Home },
          ].map(s => (
            <Card key={s.label} className={`p-5 flex items-center gap-4 ${s.highlight ? 'border-primary/20 bg-primary/5' : ''}`}>
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
