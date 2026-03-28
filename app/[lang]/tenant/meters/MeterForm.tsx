'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { submitMeterReading } from './_actions'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

export function MeterForm() {
  const t = useTranslations('tenant')

  const schema = z.object({
    type: z.enum(['STROM', 'GAS', 'WASSER', 'HEIZUNG']),
    value: z.coerce.number().positive(t('meterValueError')),
    readingDate: z.string().min(1, t('meterDateError')),
    note: z.string().optional(),
  })

  type FormValues = z.infer<typeof schema>

  const typeLabels: Record<string, string> = {
    STROM: t('typeSTROM_unit'),
    GAS: t('typeGAS_unit'),
    WASSER: t('typeWASSER_unit'),
    HEIZUNG: t('typeHEIZUNG_unit'),
  }

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
      <h2 className="font-medium text-foreground">{t('meterFormTitle')}</h2>
      {success && <p className="text-sm text-green-600">{t('meterSuccess')}</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t('meterType')}</label>
          <select {...register('type')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {errors.type && <p className="text-xs text-destructive mt-1">{errors.type.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t('meterValue')}</label>
          <input type="number" step="0.01" {...register('value')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="12345.67" />
          {errors.value && <p className="text-xs text-destructive mt-1">{errors.value.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t('meterDate')}</label>
          <input type="date" {...register('readingDate')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          {errors.readingDate && <p className="text-xs text-destructive mt-1">{errors.readingDate.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t('meterNote')}</label>
          <textarea {...register('note')} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder={t('meterNotePlaceholder')} />
        </div>
        <button type="submit" disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {isSubmitting ? t('meterSubmitting') : t('meterSubmit')}
        </button>
      </form>
    </Card>
  )
}
