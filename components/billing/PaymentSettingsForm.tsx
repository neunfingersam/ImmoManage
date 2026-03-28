'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { savePaymentSettings } from '@/app/[lang]/dashboard/billing/_actions'
import { CheckCircle2, Loader2 } from 'lucide-react'

type Settings = {
  bankIban: string
  bankName: string
  street: string
  zip: string
  city: string
}

export function PaymentSettingsForm({ initial }: { initial: Settings }) {
  const [values, setValues] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function set(field: keyof Settings, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    setSaved(false)
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await savePaymentSettings(values)
      if (result.success) {
        setSaved(true)
      } else {
        setError(result.error ?? 'Fehler beim Speichern')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">IBAN</label>
          <input
            value={values.bankIban}
            onChange={(e) => set('bankIban', e.target.value)}
            placeholder="CH00 0000 0000 0000 0000 0"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Bankname (optional)</label>
          <input
            value={values.bankName}
            onChange={(e) => set('bankName', e.target.value)}
            placeholder="z.B. Raiffeisen"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Strasse & Hausnummer</label>
          <input
            value={values.street}
            onChange={(e) => set('street', e.target.value)}
            placeholder="Musterstrasse 1"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">PLZ</label>
          <input
            value={values.zip}
            onChange={(e) => set('zip', e.target.value)}
            placeholder="8001"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Ort</label>
          <input
            value={values.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Zürich"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={isPending} size="sm">
          {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Speichere…</> : 'Speichern'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" /> Gespeichert
          </span>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>

      <p className="text-xs text-muted-foreground">
        Diese Angaben erscheinen im Zahlungsschein der Nebenkostenabrechnung (Swiss QR Bill).
      </p>
    </div>
  )
}
