import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeaseCard, type LeaseWithDetails } from '@/components/leases/LeaseCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { getLeases } from './_actions'

export default async function LeasesPage() {
  const leases = await getLeases()
  const active = leases.filter(l => l.status === 'ACTIVE')
  const ended = leases.filter(l => l.status !== 'ACTIVE')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Mietverträge</h1>
          <p className="text-sm text-muted-foreground mt-1">{active.length} aktiv · {ended.length} abgelaufen</p>
        </div>
        <Button render={<Link href="/dashboard/leases/new" />} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />
          Neu
        </Button>
      </div>

      {leases.length === 0 ? (
        <EmptyState icon={<FileText className="h-7 w-7" />} titel="Noch keine Mietverträge" beschreibung="Erstellen Sie den ersten Mietvertrag." />
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Aktiv</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map(l => <LeaseCard key={l.id} lease={l as LeaseWithDetails} />)}
              </div>
            </section>
          )}
          {ended.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Beendet</h2>
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
