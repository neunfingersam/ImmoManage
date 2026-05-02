import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, User, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getHandover } from '../_actions'
import { FinalizeButton } from './FinalizeButton'
import { PrintButton } from './PrintButton'

type Room = { name: string; condition: string; notes: string }

const conditionConfig: Record<string, { label: string; className: string }> = {
  GUT: { label: 'Gut', className: 'bg-green-100 text-green-700 border-green-200' },
  MAENGEL: { label: 'Mängel', className: 'bg-red-100 text-red-700 border-red-200' },
  NICHT_GEPRUEFT: { label: 'Nicht geprüft', className: 'bg-muted text-muted-foreground border-border' },
}

function ConditionBadge({ condition }: { condition: string }) {
  const config = conditionConfig[condition] ?? conditionConfig.NICHT_GEPRUEFT
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isAbgeschlossen = status === 'ABGESCHLOSSEN'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        isAbgeschlossen
          ? 'bg-green-100 text-green-700 border-green-200'
          : 'bg-amber-100 text-amber-700 border-amber-200'
      }`}
    >
      {isAbgeschlossen ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <Clock className="h-3.5 w-3.5" />
      )}
      {isAbgeschlossen ? 'Abgeschlossen' : 'Entwurf'}
    </span>
  )
}

export default async function HandoverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const lang = await getLocale()
  const { id } = await params
  const handover = await getHandover(id)
  if (!handover) notFound()

  const rooms = handover.rooms as Room[]
  const date = new Date(handover.date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const typeLabel = handover.type === 'EINZUG' ? 'Einzugsprotokoll' : 'Auszugsprotokoll'
  const hasMaengel = rooms.some(r => r.condition === 'MAENGEL')
  const maengelCount = rooms.filter(r => r.condition === 'MAENGEL').length

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + actions */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link
          href={`/${lang}/dashboard/handovers`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Alle Protokolle
        </Link>
        <div className="flex items-center gap-2">
          <PrintButton />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl text-foreground">{typeLabel}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {handover.lease.unit.property.name} · {handover.lease.unit.unitNumber}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {handover.lease.tenant.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {date}
            </span>
          </div>
        </div>
        <StatusBadge status={handover.status} />
      </div>

      {/* Summary cards */}
      {hasMaengel && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {maengelCount} {maengelCount === 1 ? 'Raum hat Mängel' : 'Räume haben Mängel'}
        </div>
      )}

      {/* General notes */}
      {handover.notes && (
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">
            Allgemeine Notizen
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{handover.notes}</p>
        </Card>
      )}

      {/* Rooms */}
      <div className="space-y-3">
        <h2 className="font-medium text-foreground">
          Räume &amp; Zustand ({rooms.length})
        </h2>
        {rooms.map((room, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-medium text-foreground">{room.name}</p>
              <ConditionBadge condition={room.condition} />
            </div>
            {room.notes && (
              <p className="mt-2 text-sm text-muted-foreground">{room.notes}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Signature status */}
      <Card className="p-4 space-y-3">
        <h2 className="font-medium text-foreground">Unterschriften</h2>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            {handover.signedByVermieter ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
            )}
            <span className={handover.signedByVermieter ? 'text-foreground' : 'text-muted-foreground'}>
              Vermieter
            </span>
          </div>
          <div className="flex items-center gap-2">
            {handover.signedByTenant ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
            )}
            <span className={handover.signedByTenant ? 'text-foreground' : 'text-muted-foreground'}>
              Mieter
            </span>
          </div>
        </div>
      </Card>

      {/* Finalize */}
      {handover.status === 'ENTWURF' && (
        <Card className="p-4 space-y-2 print:hidden">
          <h2 className="font-medium text-foreground">Protokoll abschließen</h2>
          <p className="text-sm text-muted-foreground">
            Nach dem Abschließen wird das Protokoll als unterzeichnet durch den Vermieter markiert
            und kann nicht mehr bearbeitet werden.
          </p>
          <FinalizeButton id={id} />
        </Card>
      )}
    </div>
  )
}
