import { Gauge } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { getAllReadings } from './_actions'

const typeLabels: Record<string, string> = { STROM: 'Strom', GAS: 'Gas', WASSER: 'Wasser', HEIZUNG: 'Heizung' }

export default async function DashboardMetersPage() {
  const readings = await getAllReadings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Zählerstände</h1>
        <p className="text-sm text-muted-foreground mt-1">{readings.length} Ablesungen</p>
      </div>

      {readings.length === 0 ? (
        <EmptyState icon={<Gauge className="h-7 w-7" />} titel="Keine Ablesungen" beschreibung="Noch keine Zählerstände von Mietern eingereicht." />
      ) : (
        <div className="space-y-2">
          {readings.map(r => (
            <Card key={r.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{r.tenant.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.lease.unit.property.name} · {r.lease.unit.unitNumber} · {typeLabels[r.type] ?? r.type}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(r.readingDate).toLocaleDateString('de-DE')}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-lg text-foreground">{r.value.toLocaleString('de-DE')}</p>
                <p className="text-xs text-muted-foreground">{r.unit}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
