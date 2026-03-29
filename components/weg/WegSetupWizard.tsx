'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Building2, MapPin, Shield, Check, ArrowRight, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createWegProperty } from '@/app/[lang]/dashboard/weg/_actions'
import { CH_CANTONS } from '@/lib/weg-cantons'

type Step = 1 | 2

export function WegSetupWizard() {
  const router = useRouter()
  const locale = useLocale()
  const [step, setStep] = useState<Step>(1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)

  const [form, setFormState] = useState({
    name: '',
    address: '',
    unitCount: '',
    year: '',
    kanton: '',
    gebVersicherungswert: '',
  })

  function set(field: keyof typeof form, value: string) {
    setFormState(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      const result = await createWegProperty({
        name: form.name,
        address: form.address,
        unitCount: parseInt(form.unitCount),
        year: form.year ? parseInt(form.year) : undefined,
        kanton: form.kanton || undefined,
        gebVersicherungswert: form.gebVersicherungswert ? parseFloat(form.gebVersicherungswert.replace(/'/g, '')) : undefined,
      })
      if (result.success && result.data) {
        setCreatedId(result.data.id)
        setStep(2)
      } else {
        setError(result.error ?? 'Fehler')
      }
    })
  }

  const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1"

  if (step === 2 && createdId) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold">WEG erfolgreich angelegt</h2>
          <p className="text-sm text-muted-foreground">
            Jetzt können Sie die Eigentümer erfassen und deren Wertquoten hinterlegen.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => router.push(`/${locale}/dashboard/weg/${createdId}/owners`)}
              className="w-full"
            >
              Eigentümer erfassen
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
            <button
              onClick={() => router.push(`/${locale}/dashboard/weg`)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Später
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground">Neue WEG erfassen</h1>
        <p className="text-sm text-muted-foreground mt-1">Stockwerkeigentümergemeinschaft anlegen</p>
      </div>

      <Card className="p-6 space-y-5">
        {/* Section: Liegenschaft */}
        <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
          <Building2 className="h-4 w-4 text-primary" />
          Liegenschaft
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Name der Liegenschaft *</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="z.B. Überbauung Rosengarten"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>
              <MapPin className="h-3 w-3 inline mr-1" />
              Adresse *
            </label>
            <input
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Musterstrasse 1, 8001 Zürich"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Anzahl Stockwerkeinheiten *</label>
            <input
              type="number"
              min="2"
              value={form.unitCount}
              onChange={e => set('unitCount', e.target.value)}
              placeholder="z.B. 12"
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground mt-1">Einheiten werden automatisch erstellt</p>
          </div>
          <div>
            <label className={labelClass}>Baujahr</label>
            <input
              type="number"
              min="1800"
              max="2100"
              value={form.year}
              onChange={e => set('year', e.target.value)}
              placeholder="z.B. 1985"
              className={inputClass}
            />
          </div>
        </div>

        <div className="border-t border-border pt-4" />

        {/* Section: WEG-spezifisch */}
        <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
          <Shield className="h-4 w-4 text-primary" />
          WEG-Angaben
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Kanton</label>
            <select
              value={form.kanton}
              onChange={e => set('kanton', e.target.value)}
              className={inputClass}
            >
              <option value="">Kanton wählen</option>
              {CH_CANTONS.map(c => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>
              Gebäudeversicherungswert (CHF)
              <span
                title="Zu finden auf Ihrer Gebäudeversicherungspolice. Wird für die Berechnung des Erneuerungsfonds benötigt."
                className="ml-1 inline-flex cursor-help"
              >
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
            <p className="text-xs text-muted-foreground mt-1">
              Zu finden auf Ihrer Gebäudeversicherungspolice
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleCreate}
            disabled={isPending || !form.name || !form.address || !form.unitCount}
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Erstelle…</>
            ) : (
              <>WEG anlegen <ArrowRight className="h-4 w-4 ml-1.5" /></>
            )}
          </Button>
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Abbrechen
          </button>
        </div>
      </Card>
    </div>
  )
}
