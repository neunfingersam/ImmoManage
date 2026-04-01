'use client'

import { useState } from 'react'
import { saveAttendance } from './_actions'

type Owner = { id: string; mea: number; userName: string }
type AttRecord = { anwesend: boolean; vertretenDurch: string | null }

export default function AttendanceForm({ owners, attendanceMap, assemblyId }: {
  owners: Owner[]
  attendanceMap: Record<string, AttRecord>
  assemblyId: string
}) {
  const [saving, setSaving] = useState<string | null>(null)

  async function handleChange(ownerId: string, field: 'anwesend' | 'vertretenDurch', value: boolean | string | null) {
    setSaving(ownerId)
    const current = attendanceMap[ownerId] ?? { anwesend: false, vertretenDurch: null }
    const update = field === 'anwesend'
      ? { ...current, anwesend: value as boolean }
      : { ...current, vertretenDurch: value as string | null }
    await saveAttendance(assemblyId, ownerId, update)
    setSaving(null)
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-2 pr-4">Eigentümer</th>
          <th className="pb-2 pr-4 text-right">MEA</th>
          <th className="pb-2 pr-4">Anwesend</th>
          <th className="pb-2">Vertreten durch</th>
        </tr>
      </thead>
      <tbody>
        {owners.map((owner) => {
          const att = attendanceMap[owner.id]
          return (
            <tr key={owner.id} className="border-b">
              <td className="py-2 pr-4">{owner.userName}</td>
              <td className="py-2 pr-4 text-right">{owner.mea}</td>
              <td className="py-2 pr-4">
                <input type="checkbox" checked={att?.anwesend ?? false} disabled={saving === owner.id}
                  onChange={(e) => handleChange(owner.id, 'anwesend', e.target.checked)} />
              </td>
              <td className="py-2">
                {!att?.anwesend && (
                  <input type="text" placeholder="Name des Vertreters"
                    defaultValue={att?.vertretenDurch ?? ''}
                    disabled={saving === owner.id}
                    onBlur={(e) => handleChange(owner.id, 'vertretenDurch', e.target.value || null)}
                    className="rounded border px-2 py-1 text-sm w-full max-w-xs" />
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
