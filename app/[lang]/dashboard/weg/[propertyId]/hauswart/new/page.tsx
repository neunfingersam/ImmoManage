'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import { createHauswartEntry } from '../_actions'

export default function NewHauswartEntryPage() {
  const router = useRouter()
  const params = useParams<{ lang: string; propertyId: string }>()
  const [kategorie, setKategorie] = useState('STUNDEN')
  const [error, setError] = useState<string | null>(null)

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
    const result = await createHauswartEntry(params.propertyId, data)
    if (result.success) router.push(`/${params.lang}/dashboard/weg/${params.propertyId}/hauswart`)
    else setError(result.error ?? 'Fehler')
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-semibold">Eintrag erfassen</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Datum</label>
          <input type="date" name="datum" required className="w-full rounded border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kategorie</label>
          <select name="kategorie" value={kategorie} onChange={(e) => setKategorie(e.target.value)} className="w-full rounded border px-3 py-2 text-sm">
            <option value="STUNDEN">Stunden</option>
            <option value="SPESEN">Spesen</option>
            <option value="MATERIAL">Material</option>
            <option value="FREMDLEISTUNG">Fremdleistung</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Beschreibung</label>
          <input type="text" name="beschreibung" required className="w-full rounded border px-3 py-2 text-sm" />
        </div>
        {kategorie === 'STUNDEN' ? (
          <div>
            <label className="block text-sm font-medium mb-1">Stunden</label>
            <input type="number" name="stunden" step="0.25" min="0.25" required className="w-full rounded border px-3 py-2 text-sm" />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Betrag (CHF)</label>
            <input type="number" name="betrag" step="0.01" min="0.01" required className="w-full rounded border px-3 py-2 text-sm" />
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Speichern</button>
          <button type="button" onClick={() => router.back()} className="rounded border px-4 py-2 text-sm">Abbrechen</button>
        </div>
      </form>
    </div>
  )
}
