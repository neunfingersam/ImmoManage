'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { leaseSchema, type LeaseFormValues } from '@/lib/schemas/lease'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { ActionResult } from '@/lib/action-result'
import type { Lease, Unit, Property, User } from '@/lib/generated/prisma'

type UnitOption = Unit & { property: Pick<Property, 'id' | 'name'> }
type TenantOption = Pick<User, 'id' | 'name' | 'email'>

type Props = {
  units: UnitOption[]
  tenants: TenantOption[]
  action: (data: LeaseFormValues) => Promise<ActionResult<Lease>>
}

export function LeaseForm({ units, tenants, action }: Props) {
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LeaseFormValues>({
    resolver: zodResolver(leaseSchema) as any,
    defaultValues: { depositPaid: false },
  })

  const unitId = watch('unitId')
  const tenantId = watch('tenantId')

  function onSubmit(data: unknown) {
    const formData = data as LeaseFormValues
    setServerError(null)
    startTransition(async () => {
      const result = await action(formData)
      if (result.success) {
        router.push('/dashboard/leases')
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="space-y-1">
        <Label>Einheit</Label>
        <Select value={unitId ?? ''} onValueChange={(v) => setValue('unitId', v ?? '')}>
          <SelectTrigger>
            <SelectValue placeholder="Einheit wählen" />
          </SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.property.name} · {u.unitNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.unitId && <p className="text-sm text-destructive">{errors.unitId.message as string}</p>}
      </div>

      <div className="space-y-1">
        <Label>Mieter</Label>
        <Select value={tenantId ?? ''} onValueChange={(v) => setValue('tenantId', v ?? '')}>
          <SelectTrigger>
            <SelectValue placeholder="Mieter wählen" />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} ({t.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tenantId && <p className="text-sm text-destructive">{errors.tenantId.message as string}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="startDate">Startdatum</Label>
          <Input id="startDate" type="date" {...register('startDate')} />
          {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message as string}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="endDate">Enddatum (optional)</Label>
          <Input id="endDate" type="date" {...register('endDate')} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="coldRent">Kaltmiete (€)</Label>
          <Input id="coldRent" type="number" step="0.01" {...register('coldRent')} />
          {errors.coldRent && <p className="text-sm text-destructive">{errors.coldRent.message as string}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="extraCosts">Nebenkosten (€)</Label>
          <Input id="extraCosts" type="number" step="0.01" {...register('extraCosts')} />
          {errors.extraCosts && <p className="text-sm text-destructive">{errors.extraCosts.message as string}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="depositPaid" {...register('depositPaid')} className="rounded border-border" />
        <Label htmlFor="depositPaid">Kaution erhalten</Label>
      </div>

      {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? 'Wird gespeichert…' : 'Mietvertrag erstellen'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/dashboard/leases')}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
