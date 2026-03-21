import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/tickets/TicketStatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { getMyTickets } from './_actions'

export default async function TenantTicketsPage() {
  const tickets = await getMyTickets()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Meine Meldungen</h1>
          <p className="text-sm text-muted-foreground mt-1">{tickets.length} Meldung{tickets.length !== 1 ? 'en' : ''}</p>
        </div>
        <Button render={<Link href="/tenant/tickets/new" />} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />
          Neue Meldung
        </Button>
      </div>

      {tickets.length === 0 ? (
        <EmptyState icon={<AlertCircle className="h-7 w-7" />} titel="Keine Meldungen" beschreibung="Sie haben noch keine Schadensmeldung eingereicht." />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/tenant/tickets/${t.id}`}>
              <Card className="p-4 flex items-center justify-between gap-3 hover:shadow-card-hover transition-shadow">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.property.name}{t.unit ? ` · ${t.unit.unitNumber}` : ''} · {new Date(t.createdAt).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TicketPriorityBadge priority={t.priority} />
                  <TicketStatusBadge status={t.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
