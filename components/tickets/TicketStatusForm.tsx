'use client'

import { useState, useTransition } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { ActionResult } from '@/lib/action-result'
import type { Ticket } from '@/lib/generated/prisma'

type Props = {
  currentStatus: string
  onUpdate: (data: { status: string }) => Promise<ActionResult<Ticket>>
}

export function TicketStatusForm({ currentStatus, onUpdate }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await onUpdate({ status })
    })
  }

  return (
    <div className="flex items-end gap-2">
      <div className="space-y-1 flex-1">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v ?? currentStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Offen</SelectItem>
            <SelectItem value="IN_PROGRESS">In Bearbeitung</SelectItem>
            <SelectItem value="DONE">Erledigt</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSave} disabled={pending || status === currentStatus} size="sm" className="bg-primary hover:bg-primary/90">
        {pending ? 'Speichern…' : 'Speichern'}
      </Button>
    </div>
  )
}
