'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Card } from '@/components/ui/card'
import { createHandover } from '../_actions'
import { Plus, Trash2 } from 'lucide-react'

type Lease = {
  id: string
  tenant: { name: string }
  unit: { unitNumber: string; property: { name: string } }
}
type Room = { name: string; condition: 'GUT' | 'MAENGEL' | 'NICHT_GEPRUEFT'; notes: string }

const DEFAULT_ROOMS: Room[] = [
  { name: 'Eingang / Flur', condition: 'GUT', notes: '' },
  { name: 'Wohnzimmer', condition: 'GUT', notes: '' },
  { name: 'Küche', condition: 'GUT', notes: '' },
  { name: 'Bad / WC', condition: 'GUT', notes: '' },
  { name: 'Schlafzimmer', condition: 'GUT', notes: '' },
]

const conditionLabels: Record<Room['condition'], string> = {
  GUT: 'Gut',
  MAENGEL: 'Mängel',
  NICHT_GEPRUEFT: 'Nicht geprüft',
}

export function HandoverForm({ leases }: { leases: Lease[] }) {
  const router = useRouter()
  const locale = useLocale()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS)
  const [newRoomName, setNewRoomName] = useState('')

  function updateRoom(idx: number, field: keyof Room, value: string) {
    setRooms(r => r.map((room, i) => (i === idx ? { ...room, [field]: value } : room)))
  }

  function addRoom() {
    if (!newRoomName.trim()) return
    setRooms(r => [...r, { name: newRoomName.trim(), condition: 'GUT', notes: '' }])
    setNewRoomName('')
  }

  function removeRoom(idx: number) {
    setRooms(r => r.filter((_, j) => j !== idx))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const result = await createHandover({
      leaseId: fd.get('leaseId') as string,
      type: fd.get('type') as 'EINZUG' | 'AUSZUG',
      date: fd.get('date') as string,
      notes: fd.get('notes') as string,
      rooms,
    })
    setSubmitting(false)
    if (result.success) {
      router.push(`/${locale}/dashboard/handovers/${result.data.id}`)
    } else {
      setError(result.error ?? 'Fehler')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive p-3 text-sm">{error}</div>
      )}

      <Card className="p-5 space-y-4">
        <h2 className="font-medium text-foreground">Grunddaten</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1">Mietvertrag</label>
            <select
              name="leaseId"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Bitte wählen…</option>
              {leases.map(l => (
                <option key={l.id} value={l.id}>
                  {l.tenant.name} · {l.unit.property.name} {l.unit.unitNumber}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Protokollart</label>
            <select
              name="type"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="EINZUG">Einzugsprotokoll</option>
              <option value="AUSZUG">Auszugsprotokoll</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Datum</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1">
              Allgemeine Notizen (optional)
            </label>
            <textarea
              name="notes"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              placeholder="z.B. Schlüsselübergabe, besondere Absprachen…"
            />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-medium text-foreground">Räume &amp; Zustand</h2>
        <div className="space-y-3">
          {rooms.map((room, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{room.name}</p>
                {i >= DEFAULT_ROOMS.length && (
                  <button
                    type="button"
                    onClick={() => removeRoom(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`${room.name} entfernen`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['GUT', 'MAENGEL', 'NICHT_GEPRUEFT'] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateRoom(i, 'condition', c)}
                    className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                      room.condition === c
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {conditionLabels[c]}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={room.notes}
                onChange={e => updateRoom(i, 'notes', e.target.value)}
                placeholder="Notiz zum Raum…"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRoom())}
            placeholder="Raum hinzufügen…"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addRoom}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted transition-colors"
            aria-label="Raum hinzufügen"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </Card>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Wird erstellt…' : 'Protokoll erstellen'}
      </button>
    </form>
  )
}
