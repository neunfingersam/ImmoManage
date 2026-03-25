'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { submitMeterReading } from './_actions'
import { useState } from 'react'
import { Card } from '@/components/ui/card'

const schema = z.object({
  type: z.enum(['STROM', 'GAS', 'WASSER', 'HEIZUNG']),
  value: z.coerce.number().positive('Wert muss positiv sein'),
  readingDate: z.string().min(1, 'Datum erforderlich'),
  note: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const typeLabels = { STROM: 'Strom (kWh)', GAS: 'Gas (kWh)', WASSER: 'Wasser (m³)', HEIZUNG: 'Heizung (kWh)' }

export function MeterForm() {
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { readingDate: new Date().toISOString().split('T')[0] },
  })

  async function onSubmit(data: FormValues) {
    const result = await submitMeterReading(data)
    if (result.success) { setSuccess(true); reset(); setTimeout(() => setSuccess(false), 3000) }
  }

  return (
    <Card className="p-5 space-y-4 max-w-md">
      <h2 className="font-medium text-foreground">Zählerstand melden</h2>
      {success && <p className="text-sm text-green-600">Zählerstand erfolgreich übermittelt!</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Zählertyp</label>
          <select {...register('type')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {errors.type && <p className="text-xs text-destructive mt-1">{errors.type.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Ablesewert</label>
          <input type="number" step="0.01" {...register('value')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="12345.67" />
          {errors.value && <p className="text-xs text-destructive mt-1">{errors.value.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Ablesedatum</label>
          <input type="date" {...register('readingDate')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          {errors.readingDate && <p className="text-xs text-destructive mt-1">{errors.readingDate.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Notiz (optional)</label>
          <textarea {...register('note')} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="z.B. Ablesezeitpunkt, Besonderheiten…" />
        </div>
        <button type="submit" disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {isSubmitting ? 'Wird übermittelt…' : 'Zählerstand melden'}
        </button>
      </form>
    </Card>
  )
}
