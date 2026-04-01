'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Loader2, Info, User, Euro } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addWegOwner, updateWegOwner } from '@/app/[lang]/dashboard/weg/_actions'

type Unit = { id: string; unitNumber: string; floor: number | null }

type OwnerFormProps = {
  propertyId: string
  units: Unit[]
  currentTotalWertquote: number
  mode?: 'create' | 'edit'
  ownerId?: string
  initial?: {
    name: string
    email: string
    phone?: string
    unitId?: string
    wertquote: number
    hypothekarbetrag?: number
    hypothekarzins?: number
    bankverbindung?: string
    zahlungsIban?: string
    mea?: number
  }
}

export function OwnerForm({ propertyId, units, currentTotalWertquote, mode = 'create', ownerId, initial }: OwnerFormProps) {
  const router = useRouter()
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setFormState] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    unitId: initial?.unitId ?? '',
    wertquote: initial?.wertquote?.toString() ?? '',
    hypothekarbetrag: initial?.hypothekarbetrag?.toString() ?? '',
    hypothekarzins: initial?.hypothekarzins?.toString() ?? '',
    bankverbindung: initial?.bankverbindung ?? '',
    zahlungsIban: initial?.zahlungsIban ?? '',
    mea: initial?.mea?.toString() ?? '0',
  })

  function set(field: keyof typeof form, value: string) {
    setFormState(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const wq = parseFloat(form.wertquote) || 0
  const newTotal = currentTotalWertquote + wq
  const remaining = 100 - currentTotalWertquote

  function submit() {
    startTransition(async () => {
      const data = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        unitId: form.unitId || undefined,
        wertquote: parseFloat(form.wertquote),
        hypothekarbetrag: form.hypothekarbetrag ? parseFloat(form.hypothekarbetrag) : undefined,
        hypothekarzins: form.hypothekarzins ? parseFloat(form.hypothekarzins) : undefined,
        bankverbindung: form.bankverbindung || undefined,
        zahlungsIban: form.zahlungsIban || undefined,
        mea: parseInt(form.mea, 10) || 0,
      }
      const result = mode === 'create'
        ? await addWegOwner(propertyId, data)
        : await updateWegOwner(ownerId!, propertyId, data)

      if (result.success) {
        router.push(`/${locale}/dashboard/weg/${propertyId}/owners`)
      } else {
        setError(result.error ?? 'Fehler')
      }
    })
  }

  const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1"

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Person */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <User className="h-4 w-4 text-primary" />
          Persönliche Daten
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Max Muster" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>E-Mail *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="max@muster.ch" className={inputClass} />
            {mode === 'create' && <p className="text-xs text-muted-foreground mt-1">Eigentümer erhält Zugang zum Owner-Portal</p>}
          </div>
          <div>
            <label className={labelClass}>Telefon</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+41 79 123 45 67" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Einheit</label>
            <select value={form.unitId} onChange={e => set('unitId', e.target.value)} className={inputClass}>
              <option value="">Keine Einheit zuweisen</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>
                  Einheit {u.unitNumber}{u.floor != null ? ` (Etage ${u.floor})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Wertquote */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          Wertquote
          <span title="Die Wertquote bestimmt den prozentualen Anteil am Gemeinschaftseigentum. Die Summe aller Eigentümer muss exakt 100% ergeben." className="cursor-help">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Wertquote (%) *</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              max="100"
              value={form.wertquote}
              onChange={e => set('wertquote', e.target.value)}
              placeholder={`Verfügbar: ${remaining.toFixed(3)}%`}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col justify-end pb-1">
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Andere Eigentümer</span>
                <span>{currentTotalWertquote.toFixed(3)}%</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Dieser Eigentümer</span>
                <span>{wq.toFixed(3)}%</span>
              </div>
              <div className={`flex justify-between font-bold border-t border-border pt-1 ${Math.abs(newTotal - 100) < 0.01 ? 'text-green-600' : newTotal > 100 ? 'text-destructive' : 'text-foreground'}`}>
                <span>Total</span>
                <span>{newTotal.toFixed(3)}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* MEA */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          MEA
          <span title="Miteigentumsanteil in Tausendsteln. Die Summe aller Eigentümer sollte 1000 ergeben." className="cursor-help">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>MEA (Miteigentumsanteil)</label>
            <input
              type="number"
              min={0}
              max={10000}
              value={form.mea}
              onChange={e => set('mea', e.target.value)}
              placeholder="z.B. 150"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">Anteil in Tausendsteln (z.B. 150 von 1000)</p>
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Finanzangaben */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Euro className="h-4 w-4 text-primary" />
          Finanzangaben (optional)
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              Hypothekarbetrag (CHF)
              <span title="Zu finden in Ihrem Hypothekarvertrag mit der Bank." className="ml-1 cursor-help">
                <Info className="h-3 w-3 text-muted-foreground inline" />
              </span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={form.hypothekarbetrag}
              onChange={e => set('hypothekarbetrag', e.target.value)}
              placeholder="Aus Hypothekarvertrag"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              Hypothekarzins (%)
              <span title="Aktueller Zinssatz Ihres Hypothekarvertrags." className="ml-1 cursor-help">
                <Info className="h-3 w-3 text-muted-foreground inline" />
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="20"
              value={form.hypothekarzins}
              onChange={e => set('hypothekarzins', e.target.value)}
              placeholder="z.B. 2.50"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Bankverbindung</label>
            <input value={form.bankverbindung} onChange={e => set('bankverbindung', e.target.value)} placeholder="z.B. UBS Zürich" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>IBAN (für Lastschrift)</label>
            <input value={form.zahlungsIban} onChange={e => set('zahlungsIban', e.target.value)} placeholder="CH00 0000 0000 0000 0000 0" className={inputClass + ' font-mono'} />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={isPending || !form.name || !form.email || !form.wertquote}>
          {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Speichere…</> : mode === 'create' ? 'Eigentümer hinzufügen' : 'Speichern'}
        </Button>
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">Abbrechen</button>
      </div>
    </div>
  )
}
