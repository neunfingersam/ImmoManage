'use client'
import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createBill } from '@/app/[lang]/dashboard/billing/_actions'

type Lease = {
  id: string
  tenant: { name: string }
  unit: { unitNumber: string; property: { id: string; name: string } }
}

export function BillForm({ leases }: { leases: Lease[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [leaseId, setLeaseId] = useState('')
  const currentYear = new Date().getFullYear()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const selected = leases.find(l => l.id === leaseId)
    if (!selected) { setError('Bitte Mietvertrag auswählen'); return }
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await createBill({
        leaseId,
        propertyId: selected.unit.property.id,
        year: parseInt(fd.get('year') as string),
        amount: parseFloat(fd.get('amount') as string),
      })
      if (result.success) { setSuccess(true); (e.target as HTMLFormElement).reset(); setLeaseId('') }
      else setError(result.error)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-lg">
      <div className="space-y-1">
        <Label>Mietvertrag</Label>
        <Select value={leaseId} onValueChange={(v) => setLeaseId(v ?? '')}>
          <SelectTrigger><SelectValue placeholder="Mieter auswählen" /></SelectTrigger>
          <SelectContent>
            {leases.map(l => (
              <SelectItem key={l.id} value={l.id}>
                {l.tenant.name} · {l.unit.property.name} {l.unit.unitNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="year">Jahr</Label>
          <Input id="year" name="year" type="number" defaultValue={currentYear - 1} min={2000} max={2100} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="amount">Betrag (€)</Label>
          <Input id="amount" name="amount" type="number" step="0.01" placeholder="250.00" required />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Abrechnung erstellt.</p>}
      <Button type="submit" disabled={pending} size="sm" className="bg-primary hover:bg-primary/90">
        {pending ? 'Erstellen…' : 'Abrechnung erstellen'}
      </Button>
    </form>
  )
}
