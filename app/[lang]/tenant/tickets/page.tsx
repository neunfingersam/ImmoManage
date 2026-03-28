import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/tickets/TicketStatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { getMyTickets } from './_actions'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function TenantTicketsPage() {
  const [t, locale, tickets] = await Promise.all([
    getTranslations('tenant'),
    getLocale(),
    getMyTickets(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">{t('myTickets')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('ticketCount', { count: tickets.length })}</p>
        </div>
        <Button render={<Link href="/tenant/tickets/new" />} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />
          {t('newTicket')}
        </Button>
      </div>

      {tickets.length === 0 ? (
        <EmptyState icon={<AlertCircle className="h-7 w-7" />} titel={t('noTicketsTitle')} beschreibung={t('noTicketsDesc')} />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/tenant/tickets/${ticket.id}`}>
              <Card className="p-4 flex items-center justify-between gap-3 hover:shadow-card-hover transition-shadow">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{ticket.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ticket.property.name}{ticket.unit ? ` · ${ticket.unit.unitNumber}` : ''} · {new Date(ticket.createdAt).toLocaleDateString(locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TicketPriorityBadge priority={ticket.priority} />
                  <TicketStatusBadge status={ticket.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
