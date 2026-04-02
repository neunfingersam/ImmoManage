import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, Users, Settings, ChevronRight, AlertTriangle, CheckCircle2, Plus, TrendingUp, UserCog, Calculator, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getWegProperty } from '../_actions'

function fmt(n: number) {
  return new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

export default async function WegDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>
}) {
  const { propertyId } = await params
  const property = await getWegProperty(propertyId)
  if (!property) notFound()

  type OwnerRow = { id: string; wertquote: number; user: { name: string }; unit: { unitNumber: string } | null }
  const cfg = property.wegConfig
  const owners = property.owners as OwnerRow[]
  const totalWertquote = owners.reduce((s: number, o: { wertquote: number }) => s + o.wertquote, 0)
  const wertquoteOk = Math.abs(totalWertquote - 100) < 0.1

  // Completion score
  const checks = [
    { label: 'Adresse', done: !!property.address },
    { label: 'Kanton', done: !!cfg?.kanton },
    { label: 'Gebäudeversicherungswert', done: !!cfg?.gebVersicherungswert },
    { label: 'Mindestens 1 Eigentümer', done: owners.length > 0 },
    { label: 'Wertquoten vollständig (100%)', done: wertquoteOk && owners.length > 0 },
    { label: 'Erneuerungsfonds erfasst', done: cfg?.fondsStand != null },
  ]
  const score = Math.round((checks.filter(c => c.done).length / checks.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/dashboard/weg" className="hover:text-foreground">WEG</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{property.name}</span>
          </div>
          <h1 className="font-serif text-2xl text-foreground">{property.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{property.address}{cfg?.kanton ? ` · Kanton ${cfg.kanton}` : ''}</p>
        </div>
        <Button render={<Link href={`/dashboard/weg/${propertyId}/settings`} />} variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-1.5" />
          Einstellungen
        </Button>
      </div>

      {/* Completion score */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Datenvollständigkeit</p>
          <span className={`text-sm font-bold ${score === 100 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-destructive'}`}>
            {score}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div
            className={`h-2 rounded-full transition-all ${score === 100 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-destructive'}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {checks.map(c => (
            <div key={c.label} className="flex items-center gap-2 text-xs">
              {c.done
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                : <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 flex-shrink-0" />}
              <span className={c.done ? 'text-foreground' : 'text-muted-foreground'}>{c.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Einheiten</p>
          <p className="text-2xl font-bold mt-1">{property.units.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Eigentümer</p>
          <p className="text-2xl font-bold mt-1">{owners.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Gebäude-VW</p>
          <p className="text-sm font-bold mt-1">
            {cfg?.gebVersicherungswert ? `CHF ${fmt(cfg.gebVersicherungswert)}` : <span className="text-muted-foreground text-xs">nicht erfasst</span>}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Erneuerungsfonds</p>
          <p className="text-sm font-bold mt-1">
            {cfg?.fondsStand != null ? `CHF ${fmt(cfg.fondsStand)}` : <span className="text-muted-foreground text-xs">nicht erfasst</span>}
          </p>
        </Card>
      </div>

      {/* Wertquoten warning */}
      {owners.length > 0 && !wertquoteOk && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/20">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
              Wertquoten ergeben {fmt(totalWertquote)}% (Soll: 100%)
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
              Bitte passen Sie die Wertquoten der Eigentümer an, bis die Summe exakt 100% ergibt.
            </p>
          </div>
        </div>
      )}

      {/* Module Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href={`/dashboard/weg/${propertyId}/fonds`}>
          <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Erneuerungsfonds</p>
                <p className="text-xs text-muted-foreground">
                  {cfg?.fondsStand != null ? `CHF ${fmt(cfg.fondsStand)}` : 'Noch nicht erfasst'}
                </p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href={`/dashboard/weg/${propertyId}/hauswart`}>
          <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserCog className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Hauswart</p>
                <p className="text-xs text-muted-foreground">Hauswartberichte & Aufgaben</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href={`/dashboard/weg/${propertyId}/budget`}>
          <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calculator className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Budget</p>
                <p className="text-xs text-muted-foreground">Jahresbudget verwalten</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href={`/dashboard/weg/${propertyId}/jahresabrechnung`}>
          <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Jahresabrechnung</p>
                <p className="text-xs text-muted-foreground">Eigentümer-Abrechnung</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Owners */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Eigentümer</h2>
          <Button render={<Link href={`/dashboard/weg/${propertyId}/owners`} />} variant="outline" size="sm">
            <Users className="h-4 w-4 mr-1.5" />
            Verwalten
          </Button>
        </div>

        {owners.length === 0 ? (
          <Card className="p-6 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Noch keine Eigentümer erfasst</p>
            <Button render={<Link href={`/dashboard/weg/${propertyId}/owners/new`} />} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Ersten Eigentümer hinzufügen
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {owners.map(o => (
              <Card key={o.id} className="p-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {o.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{o.user.name}</p>
                  <p className="text-xs text-muted-foreground">{o.unit ? `Einheit ${o.unit.unitNumber}` : 'Keine Einheit zugewiesen'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold">{o.wertquote.toFixed(3)}%</p>
                  <div className="w-20 bg-muted rounded-full h-1.5 mt-1">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(o.wertquote, 100)}%` }} />
                  </div>
                </div>
              </Card>
            ))}
            <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">Gesamte Wertquote</span>
              <span className={`text-sm font-bold ${wertquoteOk ? 'text-green-600' : 'text-destructive'}`}>
                {fmt(totalWertquote)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
