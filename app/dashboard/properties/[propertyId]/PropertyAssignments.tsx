'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { assignVermieterToProperty, removeVermieterFromProperty } from '../_actions'

type Vermieter = { id: string; name: string | null; email: string }

export function PropertyAssignments({
  propertyId,
  assigned,
  available,
}: {
  propertyId: string
  assigned: Vermieter[]
  available: Vermieter[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const unassigned = available.filter(v => !assigned.some(a => a.id === v.id))

  function handleAdd(userId: string | null) {
    if (!userId) return
    setError(null)
    startTransition(async () => {
      const result = await assignVermieterToProperty(propertyId, userId)
      if (!result.success) setError(result.error)
    })
  }

  function handleRemove(userId: string) {
    setError(null)
    startTransition(async () => {
      const result = await removeVermieterFromProperty(propertyId, userId)
      if (!result.success) setError(result.error)
    })
  }

  return (
    <div className="space-y-3">
      {assigned.length === 0 ? (
        <p className="text-sm text-muted-foreground">Kein Vermieter zugewiesen.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {assigned.map(v => (
            <span
              key={v.id}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm bg-secondary"
            >
              {v.name ?? v.email}
              <button
                onClick={() => handleRemove(v.id)}
                disabled={pending}
                className="text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`${v.name} entfernen`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {unassigned.length > 0 && (
        <div className="flex items-center gap-2">
          <Select onValueChange={(val: string | null) => handleAdd(val)} disabled={pending}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Vermieter hinzufügen…" />
            </SelectTrigger>
            <SelectContent>
              {unassigned.map(v => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name ?? v.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
