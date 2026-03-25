'use client'

import { useTransition } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteUnit, updateUnitStatusAction } from '@/app/[lang]/dashboard/properties/_actions'
import type { Unit, User, Lease } from '@/lib/generated/prisma'

type UnitWithLease = Unit & {
  leases: (Lease & { tenant: Pick<User, 'id' | 'name' | 'email'> })[]
}

type Props = {
  unit: UnitWithLease
  propertyId: string
  onEdit: (unit: UnitWithLease) => void
}

const statusLabels: Record<string, string> = {
  VERMIETET: 'Vermietet',
  LEER: 'Leer',
  RENOVIERUNG: 'Renovierung',
}

export function UnitRow({ unit, propertyId, onEdit }: Props) {
  const [pending, startTransition] = useTransition()
  const activeTenant = unit.leases[0]?.tenant

  function handleDelete() {
    if (!confirm(`Einheit "${unit.unitNumber}" wirklich löschen?`)) return
    startTransition(async () => {
      await deleteUnit(unit.id, propertyId)
    })
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as 'VERMIETET' | 'LEER' | 'RENOVIERUNG'
    startTransition(async () => {
      await updateUnitStatusAction(unit.id, status)
    })
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 px-4 font-medium text-foreground">{unit.unitNumber}</td>
      <td className="py-3 px-4 text-muted-foreground">{unit.floor !== null && unit.floor !== undefined ? `${unit.floor}. OG` : '—'}</td>
      <td className="py-3 px-4 text-muted-foreground">{unit.size ? `${unit.size} m²` : '—'}</td>
      <td className="py-3 px-4 text-muted-foreground">{unit.rooms ? `${unit.rooms} Zi.` : '—'}</td>
      <td className="py-3 px-4 text-muted-foreground">{activeTenant ? activeTenant.name : <span className="text-muted-foreground/50">Leer</span>}</td>
      <td className="py-3 px-4">
        <select
          value={unit.status}
          onChange={handleStatusChange}
          disabled={pending}
          className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground disabled:opacity-50"
        >
          {Object.entries(statusLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={() => onEdit(unit)} aria-label="Bearbeiten">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={pending} aria-label="Löschen">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
