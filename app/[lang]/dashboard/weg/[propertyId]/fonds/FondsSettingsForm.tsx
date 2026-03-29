'use client'

import { useState, useTransition } from 'react'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateFondsConfig } from '@/app/[lang]/dashboard/weg/_actions'

type Props = {
  propertyId: string
  initial: {
    fondsStand: number | null
    fondsBeitragssatz: number
    fondsObergrenze: number
    fondsLetzteEinzahlung: Date | null
  }
}

export function FondsSettingsForm({ propertyId, initial }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [form, setFormState] = useState({
    fondsStand: initial.fondsStand?.toString() ?? '',
    fondsBeitragssatz: initial.fondsBeitragssatz.toString(),
    fondsObergrenze: initial.fondsObergrenze.toString(),
  })

  function set(field: keyof typeof form, value: string) {
    setFormState(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateFondsConfig(propertyId, {
        fondsStand: form.fondsStand ? parseFloat(form.fondsStand) : 0,
        fondsBeitragssatz: parseFloat(form.fondsBeitragssatz),
        fondsObergrenze: parseFloat(form.fondsObergrenze),
      })
      if (!res.success) { setError(res.error ?? 'Fehler'); return }
      setSaved(true)
    })
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-foreground mb-4">Fonds-Einstellungen</h2>
      <div className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div>
          <Label>Aktueller Fondsstand (CHF)</Label>
          <Input type="number" value={form.fondsStand} onChange={e => set('fondsStand', e.target.value)} placeholder="0.00" />
          {initial.fondsLetzteEinzahlung && (
            <p className="text-xs text-muted-foreground mt-1">
              Letzte Aktualisierung: {new Date(initial.fondsLetzteEinzahlung).toLocaleDateString('de-CH')}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Beitragssatz (% vom Gebäudeversicherungswert / Jahr)</Label>
            <Input type="number" step="0.1" value={form.fondsBeitragssatz} onChange={e => set('fondsBeitragssatz', e.target.value)} />
          </div>
          <div>
            <Label>Obergrenze (Monatslöhne)</Label>
            <Input type="number" step="0.5" value={form.fondsObergrenze} onChange={e => set('fondsObergrenze', e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Speichern
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Gespeichert
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
