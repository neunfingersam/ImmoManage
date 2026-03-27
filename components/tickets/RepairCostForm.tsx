'use client'

import { useState, useTransition } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ActionResult } from '@/lib/action-result'
import type { Ticket } from '@/lib/generated/prisma'

type Props = {
  currentCost: number | null
  onUpdate: (cost: number | null) => Promise<ActionResult<Ticket>>
}

export function RepairCostForm({ currentCost, onUpdate }: Props) {
  const [value, setValue] = useState(currentCost != null ? String(currentCost) : '')
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const cost = value === '' ? null : parseFloat(value)
    if (cost !== null && isNaN(cost)) return
    startTransition(async () => {
      await onUpdate(cost)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="flex items-end gap-2">
      <div className="space-y-1 flex-1">
        <Label>Unterhaltskosten (CHF)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={value}
          onChange={e => { setValue(e.target.value); setSaved(false) }}
        />
      </div>
      <Button
        onClick={handleSave}
        disabled={pending}
        size="sm"
        variant="outline"
      >
        {pending ? 'Speichern…' : saved ? 'Gespeichert ✓' : 'Speichern'}
      </Button>
    </div>
  )
}
