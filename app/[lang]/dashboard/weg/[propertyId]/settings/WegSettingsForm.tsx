'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Loader2, Info, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateWegConfig } from '@/app/[lang]/dashboard/weg/_actions'
import { CH_CANTONS } from '@/lib/weg-cantons'

type WegSettingsFormProps = {
  propertyId: string
  initial: {
    kanton?: string | null
    gebVersicherungswert?: number | null
    fondsBeitragssatz?: number | null
    fondsObergrenze?: number | null
    fondsStand?: number | null
  }
}

export function WegSettingsForm({ propertyId, initial }: WegSettingsFormProps) {
  const router = useRouter()
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [form, setFormState] = useState({
    kanton: initial.kanton ?? '',
    gebVersicherungswert: initial.gebVersicherungswert?.toString() ?? '',
    fondsBeitragssatz: initial.fondsBeitragssatz?.toString() ?? '0.4',
    fondsObergrenze: initial.fondsObergrenze?.toString() ?? '5.0',
    fondsStand: initial.fondsStand?.toString() ?? '',
  })

  function set(field: keyof typeof form, value: string) {
    setFormState(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSaved(false)
  }

  function submit() {
    startTransition(async () => {
      const result = await updateWegConfig(propertyId, {
        kanton: form.kanton || undefined,
        gebVersicherungswert: form.gebVersicherungswert ? parseFloat(form.gebVersicherungswert) : undefined,
        fondsBeitragssatz: form.fondsBeitragssatz ? parseFloat(form.fondsBeitragssatz) : undefined,
        fondsObergrenze: form.fondsObergrenze ? parseFloat(form.fondsObergrenze) : undefined,
        fondsStand: form.fondsStand ? parseFloat(form.fondsStand) : undefined,
      })
      if (result.success) {
        setSaved(true)
        router.refresh()
      } else {
        setError(result.error ?? 'Fehler beim Speichern')
      }
    })
  }

  const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1"

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Liegenschaft & Kanton */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Kanton</label>
          <select value={form.kanton} onChange={e => set('kanton', e.target.value)} className={inputClass}>
            <option value="">Kanton wählen</option>
            {CH_CANTONS.map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>
            Gebäudeversicherungswert (CHF)
            <span title="Zu finden auf Ihrer Gebäudeversicherungspolice. Basis für die Berechnung des Erneuerungsfonds." className="ml-1 cursor-help inline-flex">
              <Info className="h-3 w-3 text-muted-foreground" />
            </span>
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={form.gebVersicherungswert}
            onChange={e => set('gebVersicherungswert', e.target.value)}
            placeholder="Aus Gebäudeversicherungspolice"
            className={inputClass}
          />
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Erneuerungsfonds */}
      <div>
        <h3 className="text-sm font-medium mb-4">Erneuerungsfonds</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>
              Beitragssatz (% des GVW)
              <span title="Jährlicher Einzahlungssatz als Prozentsatz des Gebäudeversicherungswerts. Empfehlung: 0.3–0.5%." className="ml-1 cursor-help inline-flex">
                <Info className="h-3 w-3 text-muted-foreground" />
              </span>
            </label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="10"
              value={form.fondsBeitragssatz}
              onChange={e => set('fondsBeitragssatz', e.target.value)}
              placeholder="0.4"
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground mt-1">Empfehlung: 0.3–0.5%</p>
          </div>
          <div>
            <label className={labelClass}>
              Obergrenze (% des GVW)
              <span title="Maximaler Fondsstand als Prozentsatz des Gebäudeversicherungswerts." className="ml-1 cursor-help inline-flex">
                <Info className="h-3 w-3 text-muted-foreground" />
              </span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="50"
              value={form.fondsObergrenze}
              onChange={e => set('fondsObergrenze', e.target.value)}
              placeholder="5.0"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Aktueller Fondsstand (CHF)</label>
            <input
              type="number"
              min="0"
              step="100"
              value={form.fondsStand}
              onChange={e => set('fondsStand', e.target.value)}
              placeholder="Aktuelles Guthaben"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
      {saved && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">Einstellungen gespeichert.</p>}

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={isPending}>
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Speichere…</>
            : <><Save className="h-4 w-4 mr-1.5" />Speichern</>
          }
        </Button>
        <button
          onClick={() => router.push(`/${locale}/dashboard/weg/${propertyId}`)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}
