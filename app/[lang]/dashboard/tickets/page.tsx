import Link from 'next/link'
import { AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { TicketCard } from '@/components/tickets/TicketCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { KiSummaryButton } from '@/components/shared/KiSummaryButton'
import { getTickets } from './_actions'
import { getTranslations } from 'next-intl/server'

const DONE_PAGE_SIZE = 20

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; q?: string }>
}) {
  const [t, { done: doneParam, q }] = await Promise.all([
    getTranslations('tickets'),
    searchParams,
  ])
  const donePage = Math.max(1, parseInt(doneParam ?? '1', 10) || 1)
  const search = q ?? ''
  const { open, inProgress, done, doneTotal } = await getTickets(donePage, search)
  const doneTotalPages = Math.ceil(doneTotal / DONE_PAGE_SIZE)

  function donePageHref(p: number) {
    const params = new URLSearchParams()
    if (p > 1) params.set('done', String(p))
    if (search) params.set('q', search)
    const qs = params.toString()
    return `/dashboard/tickets${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? t('searchResults', { count: open.length + inProgress.length + doneTotal, q: search })
              : t('subtitle', { open: open.length, inProgress: inProgress.length, done: doneTotal })}
          </p>
        </div>
        <KiSummaryButton apiPath="/api/agent/ticket-summary" label={t('kiSummary')} />
      </div>

      <form method="GET" action="/dashboard/tickets" className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </form>

      {open.length === 0 && inProgress.length === 0 && doneTotal === 0 ? (
        <EmptyState
          icon={<AlertCircle className="h-7 w-7" />}
          titel={search ? t('noResults') : t('empty')}
          beschreibung={search ? t('noResultsDesc', { q: search }) : t('emptyDesc')}
        />
      ) : (
        <>
          {open.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('openSection')}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {open.map(ticket => <TicketCard key={ticket.id} ticket={ticket as any} detailHref={`/dashboard/tickets/${ticket.id}`} />)}
              </div>
            </section>
          )}
          {inProgress.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('inProgressSection')}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inProgress.map(ticket => <TicketCard key={ticket.id} ticket={ticket as any} detailHref={`/dashboard/tickets/${ticket.id}`} />)}
              </div>
            </section>
          )}
          {doneTotal > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t('doneSection')}{doneTotalPages > 1 ? ` · ${donePage}/${doneTotalPages}` : ''}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {done.map(ticket => <TicketCard key={ticket.id} ticket={ticket as any} detailHref={`/dashboard/tickets/${ticket.id}`} />)}
              </div>
              {doneTotalPages > 1 && (
                <div className="flex items-center gap-2 pt-2">
                  {donePage > 1 && (
                    <Link href={donePageHref(donePage - 1)} className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                      {t('prevPage')}
                    </Link>
                  )}
                  {donePage < doneTotalPages && (
                    <Link href={donePageHref(donePage + 1)} className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                      {t('nextPage')}
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
