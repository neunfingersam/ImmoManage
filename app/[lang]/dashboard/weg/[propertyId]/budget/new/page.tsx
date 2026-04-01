'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import { createStegBudget } from '../_actions'

const KATEGORIEN = ['VERSICHERUNG','HAUSWART','REINIGUNG','ALLGEMEINSTROM','LIFT_SERVICE','GARTEN','SCHNEERAEUMUNG','VERWALTUNGSHONORAR','HEIZUNG','SONSTIGES'] as const
type Position = { kategorie: string; beschreibung: string; budgetBetrag: string }

export default function NewBudgetPage() {
  const router = useRouter()
  const params = useParams<{ lang: string; propertyId: string }>()
  const [positionen, setPositionen] = useState<Position[]>([{ kategorie: 'VERSICHERUNG', beschreibung: '', budgetBetrag: '' }])
  const [error, setError] = useState<string | null>(null)

  function addPosition() { setPositionen(p => [...p, { kategorie: 'SONSTIGES', beschreibung: '', budgetBetrag: '' }]) }
  function removePosition(i: number) { setPositionen(p => p.filter((_, idx) => idx !== i)) }
  function updatePosition(i: number, field: keyof Position, value: string) {
    setPositionen(p => p.map((pos, idx) => idx === i ? { ...pos, [field]: value } : pos))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const result = await createStegBudget(params.propertyId, {
      jahr: parseInt(fd.get('jahr') as string),
      positionen: positionen.map(p => ({ kategorie: p.kategorie, beschreibung: p.beschreibung, budgetBetrag: parseFloat(p.budgetBetrag) })),
    })
    if (result.success) router.push(`/${params.lang}/dashboard/weg/${params.propertyId}/budget/${parseInt(fd.get('jahr') as string)}`)
    else setError(result.error ?? 'Fehler')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold">Jahresbudget erstellen</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Jahr</label>
          <input type="number" name="jahr" min={2020} max={2100} defaultValue={new Date().getFullYear() + 1} required className="w-32 rounded border px-3 py-2 text-sm" />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">Positionen</label>
            <button type="button" onClick={addPosition} className="text-sm text-blue-600 hover:underline">+ Position hinzufügen</button>
          </div>
          <div className="space-y-2">
            {positionen.map((pos, i) => (
              <div key={i} className="flex gap-2 items-start">
                <select value={pos.kategorie} onChange={(e) => updatePosition(i, 'kategorie', e.target.value)} className="rounded border px-2 py-2 text-sm w-44">
                  {KATEGORIEN.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <input type="text" placeholder="Beschreibung" value={pos.beschreibung} onChange={(e) => updatePosition(i, 'beschreibung', e.target.value)} required className="flex-1 rounded border px-2 py-2 text-sm" />
                <input type="number" placeholder="CHF" value={pos.budgetBetrag} onChange={(e) => updatePosition(i, 'budgetBetrag', e.target.value)} step="0.01" min="0.01" required className="w-28 rounded border px-2 py-2 text-sm" />
                {positionen.length > 1 && <button type="button" onClick={() => removePosition(i)} className="text-red-500 px-1">✕</button>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Total: CHF {positionen.reduce((s, p) => s + (parseFloat(p.budgetBetrag) || 0), 0).toFixed(2)}</p>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Budget erstellen</button>
          <button type="button" onClick={() => router.back()} className="rounded border px-4 py-2 text-sm">Abbrechen</button>
        </div>
      </form>
    </div>
  )
}
