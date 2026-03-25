'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createEvent } from '@/app/[lang]/dashboard/calendar/_actions'

const typeLabels = [
  { value: 'VERTRAGSENDE', label: 'Vertragsende' },
  { value: 'ABLESUNG', label: 'Ablesung' },
  { value: 'KUENDIGUNG', label: 'Kündigung' },
  { value: 'WARTUNG', label: 'Wartung' },
  { value: 'SONSTIGES', label: 'Sonstiges' },
]

type Property = { id: string; name: string }
type Unit = { id: string; unitNumber: string; propertyId: string }

type Props = {
  properties: Property[]
  units: Unit[]
}

export function EventForm({ properties, units }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [type, setType] = useState('SONSTIGES')
  const [scope, setScope] = useState<'none' | 'property' | 'unit'>('none')
  const [propertyId, setPropertyId] = useState('')
  const [unitId, setUnitId] = useState('')

  const filteredUnits = units.filter(u => u.propertyId === propertyId)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await createEvent({
        title: fd.get('title') as string,
        date: fd.get('date') as string,
        type,
        propertyId: scope !== 'none' ? propertyId || null : null,
        unitId: scope === 'unit' ? unitId || null : null,
      })
      if (result.success) {
        setSuccess(true)
        ;(e.target as HTMLFormElement).reset()
        setType('SONSTIGES')
        setScope('none')
        setPropertyId('')
        setUnitId('')
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="title">Titel</Label>
          <Input id="title" name="title" placeholder="z.B. Wartung Aufzug" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="date">Datum</Label>
          <Input id="date" name="date" type="date" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Typ</Label>
          <Select value={type} onValueChange={(v) => setType(v ?? 'SONSTIGES')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {typeLabels.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Betrifft</Label>
          <Select value={scope} onValueChange={(v) => { setScope((v ?? 'none') as 'none' | 'property' | 'unit'); setPropertyId(''); setUnitId('') }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Kein Bezug</SelectItem>
              <SelectItem value="property">Gesamtes Haus</SelectItem>
              <SelectItem value="unit">Einzelne Einheit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(scope === 'property' || scope === 'unit') && (
        <div className="space-y-1">
          <Label>Immobilie</Label>
          <Select value={propertyId} onValueChange={(v) => { setPropertyId(v ?? ''); setUnitId('') }}>
            <SelectTrigger><SelectValue placeholder="Immobilie wählen" /></SelectTrigger>
            <SelectContent>
              {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {scope === 'unit' && propertyId && (
        <div className="space-y-1">
          <Label>Einheit</Label>
          <Select value={unitId} onValueChange={(v) => setUnitId(v ?? '')}>
            <SelectTrigger><SelectValue placeholder="Einheit wählen" /></SelectTrigger>
            <SelectContent>
              {filteredUnits.map(u => <SelectItem key={u.id} value={u.id}>{u.unitNumber}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {scope !== 'none' && (
        <p className="text-xs text-muted-foreground">
          {scope === 'property'
            ? 'Alle Mieter dieser Immobilie werden benachrichtigt.'
            : 'Der Mieter dieser Einheit wird benachrichtigt.'}
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Termin erstellt.</p>}
      <Button type="submit" disabled={pending} size="sm" className="bg-primary hover:bg-primary/90">
        {pending ? 'Erstellen…' : 'Termin hinzufügen'}
      </Button>
    </form>
  )
}
