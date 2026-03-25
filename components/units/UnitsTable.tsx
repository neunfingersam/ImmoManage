'use client'

import { useState } from 'react'
import { UnitRow } from './UnitRow'
import { UnitDialog } from './UnitDialog'
import type { Unit, User, Lease } from '@/lib/generated/prisma'

type UnitWithLease = Unit & {
  leases: (Lease & { tenant: Pick<User, 'id' | 'name' | 'email'> })[]
}

export function UnitsTable({ units, propertyId }: { units: UnitWithLease[]; propertyId: string }) {
  const [editUnit, setEditUnit] = useState<UnitWithLease | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  function handleEdit(unit: UnitWithLease) {
    setEditUnit(unit)
    setEditOpen(true)
  }

  return (
    <>
      <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Einheit</th>
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Etage</th>
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Größe</th>
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Zimmer</th>
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Mieter</th>
            <th className="py-2.5 px-4" />
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <UnitRow key={unit.id} unit={unit} propertyId={propertyId} onEdit={handleEdit} />
          ))}
        </tbody>
      </table>
      </div>

      {editUnit && (
        <UnitDialog
          propertyId={propertyId}
          editUnit={editUnit}
          open={editOpen}
          onOpenChange={(o) => { setEditOpen(o); if (!o) setEditUnit(null) }}
        />
      )}
    </>
  )
}
