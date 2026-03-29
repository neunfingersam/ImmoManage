import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getWegProperty } from '@/app/[lang]/dashboard/weg/_actions'
import { FondsChart } from './FondsChart'
import { RenewalPlanSection } from './RenewalPlanSection'
import { FondsSettingsForm } from './FondsSettingsForm'
import { FondsPdfButton, type AmpelStatus } from './FondsPdfButton'

function calcAmpel(
  fondsStand: number | null,
  renewalItems: { restlebensdauer: number | null; erneuerungskosten: number | null; letzteErneuerung: number | null }[],
): AmpelStatus {
  if (fondsStand == null) return 'rot'
  const currentYear = new Date().getFullYear()
  const costs5 = renewalItems
    .filter(r => {
      const base = r.letzteErneuerung ?? currentYear
      const due = r.restlebensdauer != null ? base + r.restlebensdauer : null
      return due != null && due <= currentYear + 5
    })
    .reduce((s, r) => s + (r.erneuerungskosten ?? 0), 0)
  if (costs5 === 0) return 'gruen'
  const coverage = fondsStand / costs5
  if (coverage >= 1.0) return 'gruen'
  if (coverage >= 0.5) return 'gelb'
  return 'rot'
}

function AmpelBadge({ status }: { status: AmpelStatus }) {
  if (status === 'gruen') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
      <CheckCircle2 className="h-4 w-4" /> Gut gedeckt
    </span>
  )
  if (status === 'gelb') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700">
      <AlertTriangle className="h-4 w-4" /> Teilweise gedeckt
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700">
      <XCircle className="h-4 w-4" /> Unterdeckt
    </span>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

export default async function FondsPage({
  params,
}: {
  params: Promise<{ propertyId: string }>
}) {
  const { propertyId } = await params
  const property = await getWegProperty(propertyId)
  if (!property) notFound()

  const cfg = property.wegConfig
  const renewalItems = cfg?.renewalItems ?? []
  const ampelStatus = calcAmpel(cfg?.fondsStand ?? null, renewalItems)
  const showChart = cfg?.gebVersicherungswert != null && cfg?.fondsBeitragssatz != null

  const currentYear = new Date().getFullYear()
  const costs5 = renewalItems
    .filter(r => {
      const base = r.letzteErneuerung ?? currentYear
      const due = r.restlebensdauer != null ? base + r.restlebensdauer : null
      return due != null && due <= currentYear + 5
    })
    .reduce((s, r) => s + (r.erneuerungskosten ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link href={`/dashboard/weg/${propertyId}`} />}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-serif text-2xl text-foreground">Erneuerungsfonds</h1>
            <p className="text-sm text-muted-foreground">{property.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AmpelBadge status={ampelStatus} />
          <FondsPdfButton
            propertyName={property.name}
            kanton={cfg?.kanton ?? null}
            fondsStand={cfg?.fondsStand ?? null}
            fondsBeitragssatz={cfg?.fondsBeitragssatz ?? 0.4}
            ampelStatus={ampelStatus}
            renewalItems={renewalItems}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Aktueller Fondsstand</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {cfg?.fondsStand != null ? `CHF ${fmt(cfg.fondsStand)}` : '—'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Jahresbeitrag (geschätzt)</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {cfg?.gebVersicherungswert && cfg?.fondsBeitragssatz
              ? `CHF ${fmt(cfg.gebVersicherungswert * (cfg.fondsBeitragssatz / 100))}`
              : '—'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Geplante Erneuerungen (5 J.)</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {costs5 > 0 ? `CHF ${fmt(costs5)}` : '—'}
          </p>
        </Card>
      </div>

      {/* Chart */}
      {showChart ? (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">20-Jahre-Prognose</h2>
          </div>
          <FondsChart
            fondsStand={cfg!.fondsStand ?? 0}
            fondsBeitragssatz={cfg!.fondsBeitragssatz}
            gebVersicherungswert={cfg!.gebVersicherungswert!}
            renewalItems={renewalItems}
          />
        </Card>
      ) : (
        <Card className="p-5 text-center text-sm text-muted-foreground">
          Für die Prognose bitte Gebäudeversicherungswert und Beitragssatz in den Einstellungen unten erfassen.
        </Card>
      )}

      {/* Renewal Plan Table */}
      <RenewalPlanSection propertyId={propertyId} items={renewalItems} />

      {/* Fonds Settings */}
      <FondsSettingsForm
        propertyId={propertyId}
        initial={{
          fondsStand: cfg?.fondsStand ?? null,
          fondsBeitragssatz: cfg?.fondsBeitragssatz ?? 0.4,
          fondsObergrenze: cfg?.fondsObergrenze ?? 5.0,
          fondsLetzteEinzahlung: cfg?.fondsLetzteEinzahlung ?? null,
        }}
      />
    </div>
  )
}
