'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { updateHauswartEntry, deleteHauswartEntry } from '../../_actions'
import type { HauswartEntry } from '@/lib/generated/prisma'

export default function HauswartEditForm({ entry, params }: {
  entry: HauswartEntry
  params: { lang: string; propertyId: string; id: string }
}) {
  const router = useRouter()
  const [kategorie, setKategorie] = useState(entry.kategorie)
  const [error, setError] = useState<string | null>(null)
  const datum = new Date(entry.datum).toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = {
      datum: fd.get('datum') as string,
      kategorie: fd.get('kategorie') as string,
      beschreibung: fd.get('beschreibung') as string,
      stunden: fd.get('stunden') ? parseFloat(fd.get('stunden') as string) : undefined,
      betrag: fd.get('betrag') ? parseFloat(fd.get('betrag') as string) : undefined,
    }
    const result = await updateHauswartEntry(params.id, data)
    if (result.success) router.push(`/${params.lang}/dashboard/weg/${params.propertyId}/hauswart`)
    else setError(result.error ?? 'Fehler')
  }

  async function handleDelete() {
    if (!confirm('Eintrag löschen?')) return
    const result = await deleteHauswartEntry(params.id)
    if (result.success) router.push(`/${params.lang}/dashboard/weg/${params.propertyId}/hauswart`)
    else setError(result.error ?? 'Fehler')
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-semibold">Eintrag bearbeiten</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Datum</label>
          <input type="date" name="datum" defaultValue={datum} required className="w-full rounded border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kategorie</label>
          <select name="kategorie" value={kategorie} onChange={(e) => setKategorie(e.target.value as typeof kategorie)} className="w-full rounded border px-3 py-2 text-sm">
            <option value="STUNDEN">Stunden</option>
            <option value="SPESEN">Spesen</option>
            <option value="MATERIAL">Material</option>
            <option value="FREMDLEISTUNG">Fremdleistung</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Beschreibung</label>
          <input type="text" name="beschreibung" defaultValue={entry.beschreibung} required className="w-full rounded border px-3 py-2 text-sm" />
        </div>
        {kategorie === 'STUNDEN' ? (
          <div>
            <label className="block text-sm font-medium mb-1">Stunden</label>
            <input type="number" name="stunden" step="0.25" min="0.25" defaultValue={entry.stunden ?? ''} required className="w-full rounded border px-3 py-2 text-sm" />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Betrag (CHF)</label>
            <input type="number" name="betrag" step="0.01" min="0.01" defaultValue={entry.betrag ?? ''} required className="w-full rounded border px-3 py-2 text-sm" />
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Speichern</button>
          <button type="button" onClick={() => router.back()} className="rounded border px-4 py-2 text-sm">Abbrechen</button>
          <button type="button" onClick={handleDelete} className="ml-auto rounded border border-red-300 px-4 py-2 text-sm text-red-600">Löschen</button>
        </div>
      </form>
    </div>
  )
}
