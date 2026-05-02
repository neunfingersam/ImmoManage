import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeaseCard, type LeaseWithDetails } from '@/components/leases/LeaseCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { KiSummaryButton } from '@/components/shared/KiSummaryButton'
import { getLeases } from './_actions'
import { getTranslations } from 'next-intl/server'

export default async function LeasesPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const [t, leases] = await Promise.all([
    getTranslations('leases'),
    getLeases(),
  ])
  const active = leases.filter(l => l.status === 'ACTIVE')
  const ended = leases.filter(l => l.status !== 'ACTIVE')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('activeCount', { count: active.length })} · {t('endedCount', { count: ended.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <KiSummaryButton apiPath="/api/agent/lease-reminders" label={t('expiringBtn')} />
          <Button render={<Link href={`/${lang}/dashboard/leases/new`} />} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" />
            {t('newBtn')}
          </Button>
        </div>
      </div>

      {leases.length === 0 ? (
        <EmptyState icon={<FileText className="h-7 w-7" />} titel={t('empty')} beschreibung={t('emptyDesc')} />
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('activeSection')}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map(l => <LeaseCard key={l.id} lease={l as LeaseWithDetails} />)}
              </div>
            </section>
          )}
          {ended.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('endedSection')}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ended.map(l => <LeaseCard key={l.id} lease={l as LeaseWithDetails} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
