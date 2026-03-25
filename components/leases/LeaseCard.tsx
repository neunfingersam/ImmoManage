'use client'

import { useTransition } from 'react'
import { Euro, CalendarDays } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const totalRent = lease.coldRent + lease.extraCosts

  function handleEnd() {
    if (!confirm('Mietvertrag wirklich beenden?')) return
    startTransition(async () => {
      await endLease(lease.id)
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
          <Euro className="h-3.5 w-3.5" />
          <span>{totalRent.toFixed(0)} €/Monat</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{startStr} – {endStr}</span>
        </div>
      </div>
      {lease.status === 'ACTIVE' && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleEnd}
          disabled={pending}
          className="self-start text-destructive border-destructive hover:bg-destructive/10"
        >
          Beenden
        </Button>
      )}
    </Card>
  )
}
