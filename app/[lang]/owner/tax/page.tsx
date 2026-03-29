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
  return `${n.toFixed(3)} %`
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

  // Separate queries to avoid Prisma 7 deep-include type issues
  const ownerships = await prisma.propertyOwner.findMany({
    where: { userId: session.user.id },
    include: {
      property: { select: { id: true, name: true, address: true, year: true } },
      unit: { select: { unitNumber: true, floor: true } },
    },
  })

  // Load wegConfig and taxEntries separately
  const propertyIds = ownerships.map(o => o.propertyId)
  const ownerIds = ownerships.map(o => o.id)

  const [wegConfigs, taxEntries] = await Promise.all([
    prisma.wegConfig.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { propertyId: true, verkehrswert: true, kanton: true },
    }),
    prisma.wegTaxEntry.findMany({
      where: { ownerId: { in: ownerIds }, steuerjahr: year },
      include: { deductions: true },
    }),
  ])

  const configByPropertyId = Object.fromEntries(wegConfigs.map(c => [c.propertyId, c]))
  const taxEntryByOwnerId = Object.fromEntries(taxEntries.map(e => [e.ownerId, e]))

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
        const config = configByPropertyId[o.propertyId] ?? null
        const taxEntry = taxEntryByOwnerId[o.id] ?? null
        const totalDeductions = taxEntry?.deductions.reduce((s: number, d: { betrag: number }) => s + d.betrag, 0) ?? 0

        const verkehrswert = config?.verkehrswert ?? null
        const anteilWert = verkehrswert != null ? (verkehrswert * o.wertquote) / 100 : null

        // Eigenmietwert: stored or estimated at 3.5% of owner's share
        const eigenmietwert = taxEntry?.eigenmietwert ?? (anteilWert != null ? anteilWert * 0.035 : null)

        // Pauschal rate: 10% if ≤10 years old, 20% otherwise
        const buildingAge = o.property.year ? new Date().getFullYear() - o.property.year : null
        const pauschalRate = buildingAge != null && buildingAge <= 10 ? 0.10 : 0.20
        const pauschalAbzug = eigenmietwert != null ? eigenmietwert * pauschalRate : null

        const abzugsmethode = taxEntry?.abzugsmethode ?? 'PAUSCHAL'
        const unterhaltsabzug = abzugsmethode === 'PAUSCHAL' ? pauschalAbzug : totalDeductions
        const hypothekarzins = o.hypothekarzins ?? 0

        const steuerbaresEinkommen = eigenmietwert != null
          ? Math.max(0, eigenmietwert - hypothekarzins - (unterhaltsabzug ?? 0))
          : null

        return (
          <Card key={o.id} className="p-5 space-y-5">
            {/* Header */}
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

            {/* Property value & ownership share */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Liegenschaftswert</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Gesamtwert (Verkehrs-/Steuerwert)</p>
                  <p className="font-medium text-foreground">
                    {verkehrswert != null
                      ? chf(verkehrswert)
                      : <span className="text-muted-foreground italic text-xs">Nicht erfasst</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Wertquote</p>
                  <p className="font-medium text-foreground">{pct(o.wertquote)}</p>
                </div>
                {anteilWert != null && (
                  <div className="col-span-2 space-y-1 bg-muted/30 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Ihr Anteil ({pct(o.wertquote)} von {chf(verkehrswert!)})
                    </p>
                    <p className="font-semibold text-foreground text-base">{chf(anteilWert)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Tax calculation */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Steuerberechnung</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Eigenmietwert
                    {!taxEntry?.eigenmietwert && eigenmietwert != null && (
                      <span className="text-xs ml-1 opacity-60">(Schätzung 3.5%)</span>
                    )}
                  </span>
                  <span className="font-medium tabular-nums">
                    {eigenmietwert != null ? chf(eigenmietwert) : '—'}
                  </span>
                </div>

                {hypothekarzins > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>− Hypothekarzins p.a.</span>
                    <span className="tabular-nums">{chf(hypothekarzins)}</span>
                  </div>
                )}

                {eigenmietwert != null && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      − Unterhaltsabzug {abzugsmethode === 'PAUSCHAL'
                        ? `Pauschal ${Math.round(pauschalRate * 100)}%`
                        : 'Effektiv'}
                    </span>
                    <span className="tabular-nums">
                      {unterhaltsabzug != null ? chf(unterhaltsabzug) : '—'}
                    </span>
                  </div>
                )}

                {steuerbaresEinkommen != null && (
                  <div className="flex justify-between font-semibold border-t border-border pt-2 mt-1">
                    <span>Steuerbares Einkommen (Schätzung)</span>
                    <span className="tabular-nums text-primary">{chf(steuerbaresEinkommen)}</span>
                  </div>
                )}

                {eigenmietwert == null && (
                  <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 flex-shrink-0" />
                    Kein Verkehrswert erfasst — Administrator kann diesen unter WEG-Einstellungen hinterlegen.
                  </p>
                )}
              </div>
            </div>

            {/* Hypothek details */}
            {(o.hypothekarbetrag != null || o.hypothekarzins != null) && (
              <>
                <div className="border-t border-border" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Hypothek</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {o.hypothekarbetrag != null && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Hypothekarbetrag</p>
                        <p className="font-medium text-foreground">{chf(o.hypothekarbetrag)}</p>
                      </div>
                    )}
                    {o.hypothekarzins != null && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Hypothekarzins p.a.</p>
                        <p className="font-medium text-foreground">{chf(o.hypothekarzins)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Effective deductions if applicable */}
            {taxEntry && taxEntry.deductions.length > 0 && abzugsmethode !== 'PAUSCHAL' && (
              <>
                <div className="border-t border-border" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Effektive Abzüge</p>
                  <div className="space-y-1">
                    {taxEntry.deductions.map((d: { id: string; beschreibung: string; betrag: number }) => (
                      <div key={d.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{d.beschreibung}</span>
                        <span className="font-medium tabular-nums">{chf(d.betrag)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold border-t border-border pt-1 mt-1">
                      <span>Total Abzüge</span>
                      <span className="tabular-nums">{chf(totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        )
      })}

      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <Calculator className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        Schätzwerte basieren auf Verkehrswert × Wertquote. Hypothekarzinsen separat in der Steuererklärung einzutragen.
        Diese Aufstellung ersetzt keine Steuerberatung.
      </p>
    </div>
  )
}
