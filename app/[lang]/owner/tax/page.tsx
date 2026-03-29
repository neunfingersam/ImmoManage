import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/card'
import { Calculator, Building2, Info } from 'lucide-react'

function chf(n: number) {
  const parts = n.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  return `CHF ${parts[0]}.${parts[1]}`
}

function pct(n: number) {
  return `${n.toFixed(3).replace('.', '.')} %`
}

export default async function OwnerTaxPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ year?: string }>
}) {
  await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const { year: yearParam } = await searchParams
  const year = parseInt(yearParam ?? String(new Date().getFullYear() - 1))
  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const ownerships = await prisma.propertyOwner.findMany({
    where: { userId: session.user.id },
    include: {
      property: {
        select: { id: true, name: true, address: true },
      },
      unit: {
        select: { unitNumber: true, floor: true },
      },
      taxEntries: {
        where: { steuerjahr: year },
        include: { deductions: true },
      },
    },
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Steuermappe</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Steuerjahr {year} · Eigentümeranteil
          </p>
        </div>
        <select
          className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground w-fit"
          defaultValue={year}
          // year selection via form action
          form="year-form"
          name="year"
          onChange={undefined}
        >
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {ownerships.length === 0 && (
        <Card className="p-6 text-center text-muted-foreground text-sm">
          Keine Liegenschaften gefunden.
        </Card>
      )}

      {ownerships.map(o => {
        const taxEntry = o.taxEntries[0] ?? null
        const totalDeductions = taxEntry?.deductions.reduce((s, d) => s + d.betrag, 0) ?? 0

        return (
          <Card key={o.id} className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">{o.property.name}</p>
                <p className="text-sm text-muted-foreground">{o.property.address}</p>
                {o.unit && (
                  <p className="text-xs text-muted-foreground">
                    Einheit {o.unit.unitNumber}
                    {o.unit.floor != null ? ` · Etage ${o.unit.floor}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Key tax figures */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Wertquote</p>
                <p className="font-medium text-foreground">{pct(o.wertquote)}</p>
              </div>
              {o.hypothekarbetrag != null && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Hypothekarbetrag</p>
                  <p className="font-medium text-foreground">{chf(o.hypothekarbetrag)}</p>
                </div>
              )}
              {o.hypothekarzins != null && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Hypothekarzins p.a.</p>
                  <p className="font-medium text-foreground">{chf(o.hypothekarzins)}</p>
                </div>
              )}
              {taxEntry?.eigenmietwert != null && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Eigenmietwert</p>
                  <p className="font-medium text-foreground">{chf(taxEntry.eigenmietwert)}</p>
                </div>
              )}
            </div>

            {/* Deductions */}
            {taxEntry && taxEntry.deductions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Abzüge ({taxEntry.abzugsmethode})
                </p>
                <div className="space-y-1">
                  {taxEntry.deductions.map(d => (
                    <div key={d.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{d.beschreibung}</span>
                      <span className="font-medium text-foreground tabular-nums">{chf(d.betrag)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold border-t border-border pt-1 mt-1">
                    <span>Total Abzüge</span>
                    <span className="tabular-nums">{chf(totalDeductions)}</span>
                  </div>
                </div>
              </div>
            )}

            {!taxEntry && (
              <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                Keine Steuereinträge für {year} erfasst.
              </p>
            )}
          </Card>
        )
      })}

      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <Calculator className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        Hypothekarzinsen und Versicherungsprämien sind separat in der Steuererklärung einzutragen.
        Diese Aufstellung ersetzt keine Steuerberatung.
      </p>
    </div>
  )
}
