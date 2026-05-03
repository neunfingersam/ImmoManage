import { Gauge } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { getAllReadings } from './_actions'
import { getTranslations } from 'next-intl/server'

export default async function DashboardMetersPage() {
  const [readings, t] = await Promise.all([getAllReadings(), getTranslations('dashboardMeters')])

  const typeLabels: Record<string, string> = {
    STROM: t('typeSTROM'),
    GAS: t('typeGAS'),
    WASSER: t('typeWASSER'),
    HEIZUNG: t('typeHEIZUNG'),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('readingsCount', { count: readings.length })}</p>
      </div>

      {readings.length === 0 ? (
        <EmptyState icon={<Gauge className="h-7 w-7" />} titel={t('noReadingsTitle')} beschreibung={t('noReadingsDesc')} />
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
