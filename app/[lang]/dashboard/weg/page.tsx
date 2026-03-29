import Link from 'next/link'
import { Plus, Building2, Users, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getWegProperties } from './_actions'
import { EmptyState } from '@/components/shared/EmptyState'

function fmt(n: number) {
  return new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

export default async function WegPage() {
  const properties = await getWegProperties()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Stockwerkeigentum (WEG)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {properties.length} Gemeinschaft{properties.length !== 1 ? 'en' : ''}
          </p>
        </div>
        <Button render={<Link href="/dashboard/weg/new" />}>
          <Plus className="h-4 w-4 mr-1.5" />
          Neue WEG
        </Button>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7" />}
          titel="Noch keine WEG erfasst"
          beschreibung="Erfassen Sie Ihre erste Stockwerkeigentümergemeinschaft, um mit der Verwaltung zu beginnen."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(properties as Array<{ id: string; name: string; address: string | null; units: { id: string }[]; owners: { wertquote: number }[]; wegConfig: { kanton: string | null; fondsStand: number | null } | null }>).map((p) => {
            const totalWertquote = p.owners.reduce((s: number, o: { wertquote: number }) => s + o.wertquote, 0)
            const wertquoteOk = Math.abs(totalWertquote - 100) < 0.1
            const ownerCount = p.owners.length

            return (
              <Link key={p.id} href={`/dashboard/weg/${p.id}`}>
                <Card className="p-5 hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    {!wertquoteOk && ownerCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="h-3 w-3" />
                        Wertquoten prüfen
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">{p.address}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {ownerCount} Eigentümer
                    </span>
                    <span>{p.units.length} Einheiten</span>
                    {p.wegConfig?.kanton && <span>{p.wegConfig.kanton}</span>}
                  </div>
                  {p.wegConfig?.fondsStand != null && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">Erneuerungsfonds</p>
                      <p className="text-sm font-semibold text-foreground">CHF {fmt(p.wegConfig.fondsStand)}</p>
                    </div>
                  )}
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
