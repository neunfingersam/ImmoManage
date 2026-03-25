import { Gauge } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { getMyReadings } from './_actions'
import { MeterForm } from './MeterForm'

const typeLabels: Record<string, string> = { STROM: 'Strom', GAS: 'Gas', WASSER: 'Wasser', HEIZUNG: 'Heizung' }
const typeColors: Record<string, string> = { STROM: 'text-yellow-600', GAS: 'text-blue-600', WASSER: 'text-cyan-600', HEIZUNG: 'text-orange-600' }

export default async function MetersPage() {
  const readings = await getMyReadings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Zählerstände</h1>
        <p className="text-sm text-muted-foreground mt-1">{readings.length} Ablesungen gesamt</p>
      </div>

      <MeterForm />

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Meine Ablesungen</h2>
        {readings.length === 0 ? (
          <EmptyState icon={<Gauge className="h-7 w-7" />} titel="Noch keine Ablesungen" beschreibung="Melde deinen ersten Zählerstand über das Formular." />
        ) : (
          <div className="space-y-2">
            {readings.map(r => (
              <Card key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className={`font-medium ${typeColors[r.type] ?? 'text-foreground'}`}>{typeLabels[r.type] ?? r.type}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.readingDate).toLocaleDateString('de-DE')}</p>
                  {r.note && <p className="text-xs text-muted-foreground mt-0.5">{r.note}</p>}
                </div>
                <div className="text-right">
                  <p className="font-serif text-lg text-foreground">{r.value.toLocaleString('de-DE')}</p>
                  <p className="text-xs text-muted-foreground">{r.unit}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
