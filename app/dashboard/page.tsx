// app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Building2, Users, AlertCircle, Receipt } from 'lucide-react'

const kpiPlaceholder = [
  { label: 'Immobilien', wert: '—', icon: Building2 },
  { label: 'Mieter', wert: '—', icon: Users },
  { label: 'Offene Tickets', wert: '—', icon: AlertCircle },
  { label: 'Ausstehend', wert: '—', icon: Receipt },
]

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">
          Willkommen zurück, {session?.user.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hier ist eine Übersicht deiner Immobilien und Aktivitäten.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiPlaceholder.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-card bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                <kpi.icon className="h-[18px] w-[18px] text-primary" />
              </div>
            </div>
            <p className="mt-3 font-serif text-2xl text-foreground">{kpi.wert}</p>
          </div>
        ))}
      </div>

      <div className="rounded-card bg-card p-6 shadow-card">
        <h2 className="font-serif text-lg text-foreground mb-4">Letzte Aktivitäten</h2>
        <p className="text-sm text-muted-foreground">
          Aktivitäten werden in Block 2 geladen.
        </p>
      </div>
    </div>
  )
}
