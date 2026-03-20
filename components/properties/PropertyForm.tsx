'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { propertySchema, type PropertyFormValues } from '@/lib/schemas/property'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ActionResult } from '@/lib/action-result'
import type { Property } from '@/lib/generated/prisma'

type Props = {
  defaultValues?: Partial<PropertyFormValues>
  action: (data: PropertyFormValues) => Promise<ActionResult<Property>>
  submitLabel: string
  backHref: string
}

export function PropertyForm({ defaultValues, action, submitLabel, backHref }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(propertySchema) as any,
    defaultValues: { type: 'MULTI' as const, ...defaultValues },
  })

  const typeValue = watch('type')

  function onSubmit(data: unknown) {
    const typedData = data as PropertyFormValues
    startTransition(async () => {
      const result = await action(typedData)
      if (result.success) {
        router.push(backHref)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} placeholder="z.B. Musterstraße 12" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" {...register('address')} placeholder="Straße, PLZ Ort" />
        {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Typ</Label>
        <Select value={typeValue} onValueChange={(v) => setValue('type', v as 'SINGLE' | 'MULTI')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MULTI">Mehrfamilienhaus</SelectItem>
            <SelectItem value="SINGLE">Einzelimmobilie</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="unitCount">Anzahl Einheiten</Label>
        <Input id="unitCount" type="number" min={1} {...register('unitCount')} />
        {errors.unitCount && <p className="text-sm text-destructive">{errors.unitCount.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="year">Baujahr (optional)</Label>
        <Input id="year" type="number" {...register('year')} placeholder="z.B. 1985" />
        {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Beschreibung (optional)</Label>
        <Textarea id="description" {...register('description')} rows={3} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? 'Wird gespeichert…' : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
