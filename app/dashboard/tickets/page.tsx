import Link from 'next/link'
import { AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { TicketCard } from '@/components/tickets/TicketCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { getTickets } from './_actions'

const DONE_PAGE_SIZE = 20

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; q?: string }>
}) {
  const { done: doneParam, q } = await searchParams
  const donePage = Math.max(1, parseInt(doneParam ?? '1', 10) || 1)
  const search = q ?? ''
  const { open, inProgress, done, doneTotal } = await getTickets(donePage, search)
  const doneTotalPages = Math.ceil(doneTotal / DONE_PAGE_SIZE)
  const total = open.length + inProgress.length + doneTotal

  function donePageHref(p: number) {
    const params = new URLSearchParams()
    if (p > 1) params.set('done', String(p))
    if (search) params.set('q', search)
    const qs = params.toString()
    return `/dashboard/tickets${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Schadensmeldungen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {search
            ? `${total} Treffer für „${search}"`
            : `${open.length} offen · ${inProgress.length} in Bearbeitung · ${doneTotal} erledigt`}
        </p>
      </div>

      {/* Suche */}
      <form method="GET" action="/dashboard/tickets" className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Titel, Beschreibung oder Mieter…"
          className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </form>

      {open.length === 0 && inProgress.length === 0 && doneTotal === 0 ? (
        <EmptyState
          icon={<AlertCircle className="h-7 w-7" />}
          titel={search ? 'Keine Treffer' : 'Keine Meldungen'}
          beschreibung={search ? `Keine Schadensmeldung gefunden für „${search}".` : 'Es liegen aktuell keine Schadensmeldungen vor.'}
        />
      ) : (
        <>
          {open.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Offen</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {open.map(t => <TicketCard key={t.id} ticket={t as any} detailHref={`/dashboard/tickets/${t.id}`} />)}
              </div>
            </section>
          )}
          {inProgress.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">In Bearbeitung</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inProgress.map(t => <TicketCard key={t.id} ticket={t as any} detailHref={`/dashboard/tickets/${t.id}`} />)}
              </div>
            </section>
          )}
          {doneTotal > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Erledigt{doneTotalPages > 1 ? ` · Seite ${donePage} von ${doneTotalPages}` : ''}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {done.map(t => <TicketCard key={t.id} ticket={t as any} detailHref={`/dashboard/tickets/${t.id}`} />)}
              </div>
              {doneTotalPages > 1 && (
                <div className="flex items-center gap-2 pt-2">
                  {donePage > 1 && (
                    <Link href={donePageHref(donePage - 1)} className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                      Zurück
                    </Link>
                  )}
                  {donePage < doneTotalPages && (
                    <Link href={donePageHref(donePage + 1)} className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                      Weiter
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
