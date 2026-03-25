'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { moveTenantToUnit } from '../_actions'

type PropertyOption = {
  propertyId: string
  propertyName: string
  units: { unitId: string; unitNumber: string; floor: number | null }[]
}

export function MoveUnitDialog({
  tenantId,
  tenantName,
  options,
}: {
  tenantId: string
  tenantName: string
  options: PropertyOption[]
}) {
  const [open, setOpen] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const selectedProperty = options.find(p => p.propertyId === selectedPropertyId)

  function handlePropertyChange(val: string | null) {
    setSelectedPropertyId(val ?? '')
    setSelectedUnitId('')
  }

  function handleConfirm() {
    if (!selectedUnitId) return
    setError(null)
    startTransition(async () => {
      const result = await moveTenantToUnit(tenantId, selectedUnitId)
      if (result.success) {
        setOpen(false)
      } else {
        setError(result.error)
      }
    })
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Mieter umziehen
      </Button>
    )
  }

  return (
    <div className="space-y-4 rounded-md border p-4 bg-secondary/30 max-w-lg">
      <p className="text-sm font-medium">Neue Einheit für {tenantName} wählen</p>
      <div className="space-y-1">
        <Label>Objekt</Label>
        <Select onValueChange={handlePropertyChange}>
          <SelectTrigger><SelectValue placeholder="Objekt wählen…" /></SelectTrigger>
          <SelectContent>
            {options.map(p => (
              <SelectItem key={p.propertyId} value={p.propertyId}>{p.propertyName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedProperty && (
        <div className="space-y-1">
          <Label>Einheit</Label>
          <Select onValueChange={(val: string | null) => setSelectedUnitId(val ?? '')}>
            <SelectTrigger><SelectValue placeholder="Einheit wählen…" /></SelectTrigger>
            <SelectContent>
              {selectedProperty.units.map(u => (
                <SelectItem key={u.unitId} value={u.unitId}>
                  {u.unitNumber}{u.floor != null ? ` (Etage ${u.floor})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          onClick={handleConfirm}
          disabled={!selectedUnitId || pending}
          className="bg-primary hover:bg-primary/90"
        >
          {pending ? 'Wird verschoben…' : 'Bestätigen'}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Abbrechen
        </Button>
      </div>
    </div>
  )
}
