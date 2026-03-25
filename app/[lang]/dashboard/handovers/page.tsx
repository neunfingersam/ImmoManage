import Link from 'next/link'
import { ClipboardCheck, Plus, Calendar, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { getHandovers } from './_actions'

function StatusBadge({ status }: { status: string }) {
  const isAbgeschlossen = status === 'ABGESCHLOSSEN'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
        isAbgeschlossen
          ? 'bg-green-100 text-green-700 border-green-200'
          : 'bg-amber-100 text-amber-700 border-amber-200'
      }`}
    >
      {isAbgeschlossen ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {isAbgeschlossen ? 'Abgeschlossen' : 'Entwurf'}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  const isEinzug = type === 'EINZUG'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        isEinzug
          ? 'bg-blue-100 text-blue-700 border-blue-200'
          : 'bg-purple-100 text-purple-700 border-purple-200'
      }`}
    >
      {isEinzug ? 'Einzug' : 'Auszug'}
    </span>
  )
}

export default async function HandoversPage() {
  const handovers = await getHandovers()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Übergabeprotokolle</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {handovers.length === 0
              ? 'Noch keine Protokolle vorhanden.'
              : `${handovers.length} ${handovers.length === 1 ? 'Protokoll' : 'Protokolle'}`}
          </p>
        </div>
        <Link
          href="/dashboard/handovers/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Neues Protokoll
        </Link>
      </div>

      {handovers.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-7 w-7" />}
          titel="Keine Protokolle"
          beschreibung="Erstelle das erste Übergabeprotokoll für einen Ein- oder Auszug."
        />
      ) : (
        <div className="space-y-3">
          {handovers.map(h => {
            const date = new Date(h.date).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
            return (
              <Link key={h.id} href={`/dashboard/handovers/${h.id}`} className="block group">
                <Card className="p-4 hover:ring-primary/30 transition-all">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TypeBadge type={h.type} />
                        <StatusBadge status={h.status} />
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {h.lease.tenant.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {h.lease.unit.property.name} · {h.lease.unit.unitNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {date}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
