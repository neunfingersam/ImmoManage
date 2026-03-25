'use client'
import { useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createBill } from '@/app/[lang]/dashboard/billing/_actions'

const costItemSchema = z.object({
  name: z.string().min(1, 'Name erforderlich'),
  amount: z.number({ invalid_type_error: 'Betrag erforderlich' }).positive('Muss positiv sein'),
  key: z.enum(['sqm', 'unit', 'persons']),
})

const billSchema = z.object({
  leaseId: z.string().min(1, 'Mietvertrag erforderlich'),
  year: z.number().int().min(2000).max(2100),
  amount: z.number().positive('Betrag muss positiv sein'),
  costItems: z.array(costItemSchema).min(1, 'Mindestens eine Kostenposition erforderlich'),
})

type BillFormValues = z.infer<typeof billSchema>

type Lease = {
  id: string
  tenant: { name: string }
  unit: { unitNumber: string; property: { id: string; name: string } }
}

const KEY_LABELS: Record<string, string> = {
  sqm: 'Nach m² (Fläche)',
  unit: 'Pro Einheit',
  persons: 'Nach Personenzahl',
}

export function BillForm({ leases }: { leases: Lease[] }) {
  const [pending, startTransition] = useTransition()
  const currentYear = new Date().getFullYear()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      leaseId: '',
      year: currentYear - 1,
      amount: 0,
      costItems: [{ name: '', amount: 0, key: 'sqm' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'costItems' })

  function onSubmit(values: BillFormValues) {
    const selected = leases.find((l) => l.id === values.leaseId)
    if (!selected) return

    startTransition(async () => {
      await createBill({
        leaseId: values.leaseId,
        propertyId: selected.unit.property.id,
        year: values.year,
        amount: values.amount,
        costItems: values.costItems,
      })
      reset()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      {/* Mietvertrag */}
      <div className="space-y-1">
        <Label>Mietvertrag</Label>
        <Select onValueChange={(v) => setValue('leaseId', v)}>
          <SelectTrigger><SelectValue placeholder="Mieter auswählen" /></SelectTrigger>
          <SelectContent>
            {leases.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.tenant.name} · {l.unit.property.name} {l.unit.unitNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.leaseId && <p className="text-sm text-destructive">{errors.leaseId.message}</p>}
      </div>

      {/* Jahr + Gesamtbetrag */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="year">Jahr</Label>
          <Input
            id="year"
            type="number"
            {...register('year', { valueAsNumber: true })}
            min={2000} max={2100}
          />
          {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="amount">Gesamtbetrag (CHF)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="1250.00"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>
      </div>

      {/* Kostenpositionen */}
      <div className="space-y-2">
        <Label>Kostenpositionen</Label>
        {fields.map((field, idx) => (
          <div key={field.id} className="flex gap-2 items-start">
            <Input
              placeholder="Name (z.B. Heizung)"
              className="flex-1"
              {...register(`costItems.${idx}.name`)}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Betrag"
              className="w-28"
              {...register(`costItems.${idx}.amount`, { valueAsNumber: true })}
            />
            <select
              className="h-8 rounded-lg border border-border bg-background px-2 text-sm"
              {...register(`costItems.${idx}.key`)}
            >
              <option value="sqm">{KEY_LABELS.sqm}</option>
              <option value="unit">{KEY_LABELS.unit}</option>
              <option value="persons">{KEY_LABELS.persons}</option>
            </select>
            {fields.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)}>
                ✕
              </Button>
            )}
          </div>
        ))}
        {errors.costItems && (
          <p className="text-sm text-destructive">{errors.costItems.message ?? errors.costItems.root?.message}</p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ name: '', amount: 0, key: 'sqm' })}
        >
          + Kostenposition hinzufügen
        </Button>
      </div>

      <Button type="submit" disabled={pending} size="sm">
        {pending ? 'Erstellen…' : 'Abrechnung erstellen'}
      </Button>
    </form>
  )
}
