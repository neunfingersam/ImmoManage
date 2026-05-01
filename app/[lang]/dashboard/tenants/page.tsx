import Link from 'next/link'
import { Plus, Download, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TenantCard } from '@/components/tenants/TenantCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { getTenants } from './_actions'
import { Users } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

const PAGE_SIZE = 20

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const [t, { page: pageParam, q }] = await Promise.all([
    getTranslations('tenants'),
    searchParams,
  ])
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const search = q ?? ''
  const { tenants, total } = await getTenants(page, search)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function pageHref(p: number) {
    const params = new URLSearchParams()
    if (p > 1) params.set('page', String(p))
    if (search) params.set('q', search)
    const qs = params.toString()
    return `/dashboard/tenants${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? t('searchResults', { count: total, q: search }) : t('total', { count: total })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/tenants"
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Download className="h-4 w-4" />
            Excel
          </a>
          <Button render={<Link href="/dashboard/tenants/new" />} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" />
            {t('newBtn')}
          </Button>
        </div>
      </div>

      <form method="GET" action="/dashboard/tenants" className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </form>

      {tenants.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          titel={search ? t('noResults') : t('empty')}
          beschreibung={search ? t('noResultsDesc', { q: search }) : t('emptyDesc')}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => (
              <TenantCard key={tenant.id} tenant={tenant} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                {t('pageInfo', { page, totalPages, total })}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={pageHref(page - 1)}
                    className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('prevPage')}
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={pageHref(page + 1)}
                    className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                  >
                    {t('nextPage')}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
