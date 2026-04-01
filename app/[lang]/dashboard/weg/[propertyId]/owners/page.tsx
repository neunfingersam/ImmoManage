import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Plus, Pencil, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getWegProperty } from '../../_actions'
import { RemoveOwnerButton } from './RemoveOwnerButton'

function fmt(n: number) {
  return new Intl.NumberFormat('de-CH', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(n)
}

export default async function WegOwnersPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params
  const property = await getWegProperty(propertyId)
  if (!property) notFound()

  type OwnerRow = { id: string; wertquote: number; unitId: string | null; hypothekarbetrag: number | null; mea: number; user: { name: string; email: string }; unit: { unitNumber: string } | null }
  const owners = property.owners as OwnerRow[]
  const totalWertquote = owners.reduce((s: number, o: { wertquote: number }) => s + o.wertquote, 0)
  const totalMea = owners.reduce((s: number, o: { mea: number }) => s + (o.mea ?? 0), 0)
  const wertquoteOk = Math.abs(totalWertquote - 100) < 0.01

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Eigentümer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{property.name}</p>
        </div>
        <Button render={<Link href={`/dashboard/weg/${propertyId}/owners/new`} />}>
          <Plus className="h-4 w-4 mr-1.5" />
          Eigentümer hinzufügen
        </Button>
      </div>

      {/* Wertquoten summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Wertquoten-Übersicht</span>
          <span className={`flex items-center gap-1.5 text-sm font-bold ${wertquoteOk ? 'text-green-600' : 'text-destructive'}`}>
            {wertquoteOk
              ? <><CheckCircle2 className="h-4 w-4" /> 100.000% ✓</>
              : <><AlertTriangle className="h-4 w-4" /> {fmt(totalWertquote)}% (≠ 100%)</>
            }
          </span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-muted gap-0.5">
          {owners.map((o, i) => (
            <div
              key={o.id}
              style={{ width: `${Math.min(o.wertquote, 100)}%` }}
              className={`h-full ${['bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'][i % 6]}`}
              title={`${o.user.name}: ${fmt(o.wertquote)}%`}
            />
          ))}
        </div>
      </Card>

      {/* Owner list */}
      {owners.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground text-sm mb-3">Noch keine Eigentümer erfasst.</p>
          <Button render={<Link href={`/dashboard/weg/${propertyId}/owners/new`} />} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Ersten Eigentümer hinzufügen
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {owners.map(o => (
            <Card key={o.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-semibold text-primary">{o.user.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{o.user.name}</p>
                  <p className="text-xs text-muted-foreground">{o.user.email}</p>
                  {o.unit && <p className="text-xs text-muted-foreground">Einheit {o.unit.unitNumber}</p>}
                </div>
                <div className="text-right mr-4">
                  <p className="text-lg font-bold">{fmt(o.wertquote)}%</p>
                  {o.hypothekarbetrag && (
                    <p className="text-xs text-muted-foreground">
                      Hyp. CHF {new Intl.NumberFormat('de-CH').format(o.hypothekarbetrag)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    render={<Link href={`/dashboard/weg/${propertyId}/owners/${o.id}/edit`} />}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <RemoveOwnerButton ownerId={o.id} propertyId={propertyId} ownerName={o.user.name} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-3 text-sm text-muted-foreground">
        Total MEA: {totalMea} / 1000
        {totalMea !== 1000 && <span className="ml-2 text-orange-600">⚠ Total sollte 1000 ergeben</span>}
      </p>
    </div>
  )
}
