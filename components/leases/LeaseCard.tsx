'use client'

import { useTransition, useState } from 'react'
import { CircleDollarSign, CalendarDays } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { endLease } from '@/app/[lang]/dashboard/leases/_actions'
import type { Lease, Unit, Property, User } from '@/lib/generated/prisma'

export type LeaseWithDetails = Lease & {
  tenant: Pick<User, 'id' | 'name' | 'email'>
  unit: Unit & { property: Pick<Property, 'id' | 'name' | 'address'> }
}

const statusLabel: Record<string, string> = {
  ACTIVE: 'Aktiv',
  ENDED: 'Beendet',
  CANCELLED: 'Storniert',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ACTIVE: 'default',
  ENDED: 'secondary',
  CANCELLED: 'destructive',
}

export function LeaseCard({ lease }: { lease: LeaseWithDetails }) {
  const [pending, startTransition] = useTransition()
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [endDateInput, setEndDateInput] = useState('')
  const totalRent = lease.coldRent + lease.extraCosts

  function handleEnd() {
    startTransition(async () => {
      await endLease(lease.id, endDateInput || undefined)
      setShowEndDialog(false)
    })
  }

  const startStr = new Date(lease.startDate).toLocaleDateString('de-DE')
  const endStr = lease.endDate ? new Date(lease.endDate).toLocaleDateString('de-DE') : 'Unbefristet'

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">{lease.tenant.name}</p>
          <p className="text-sm text-muted-foreground">{lease.unit.property.name} · {lease.unit.unitNumber}</p>
        </div>
        <Badge variant={statusVariant[lease.status]}>{statusLabel[lease.status]}</Badge>
      </div>
      <div className="flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <CircleDollarSign className="h-3.5 w-3.5" />
          <span>CHF {totalRent.toFixed(0)}/Monat</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{startStr} – {endStr}</span>
        </div>
      </div>
      {lease.status === 'ACTIVE' && !showEndDialog && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEndDialog(true)}
          disabled={pending}
          className="self-start text-destructive border-destructive hover:bg-destructive/10"
        >
          Beenden
        </Button>
      )}
      {lease.status === 'ACTIVE' && showEndDialog && (
        <div className="space-y-3 rounded-md border p-3 bg-secondary/30">
          <div className="space-y-1">
            <Label htmlFor={`end-date-${lease.id}`} className="text-sm">Enddatum (optional)</Label>
            <Input
              id={`end-date-${lease.id}`}
              type="date"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleEnd}
              disabled={pending}
            >
              {pending ? 'Wird beendet…' : 'Bestätigen'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowEndDialog(false); setEndDateInput('') }}
              disabled={pending}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
