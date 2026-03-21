'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ticketSchema, type TicketFormValues } from '@/lib/schemas/ticket'
import type { ActionResult } from '@/lib/action-result'
import type { Ticket } from '@/lib/generated/prisma'

type Option = { propertyId: string; propertyName: string; unitId: string; unitNumber: string }

type Props = {
  options: Option[]
  action: (data: TicketFormValues) => Promise<ActionResult<Ticket>>
}

export function NewTicketForm({ options, action }: Props) {
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema) as any,
    defaultValues: {
      priority: 'MEDIUM',
      propertyId: options[0]?.propertyId ?? '',
      unitId: options[0]?.unitId ?? '',
    },
  })

  function handleOptionChange(value: string) {
    const opt = options.find(o => o.unitId === value)
    if (opt) {
      setValue('propertyId', opt.propertyId)
      setValue('unitId', opt.unitId)
    }
  }

  function onSubmit(data: unknown) {
    setServerError(null)
    startTransition(async () => {
      const result = await action(data as TicketFormValues)
      if (result.success) {
        router.push('/tenant/tickets')
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      {options.length > 0 && (
        <div className="space-y-1">
          <Label>Einheit</Label>
          <Select defaultValue={options[0]?.unitId} onValueChange={(v) => handleOptionChange(v ?? '')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(o => (
                <SelectItem key={o.unitId} value={o.unitId}>
                  {o.propertyName} · {o.unitNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="title">Titel</Label>
        <Input id="title" {...register('title')} placeholder="z.B. Heizung funktioniert nicht" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message as string}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea id="description" {...register('description')} rows={4} placeholder="Beschreiben Sie das Problem genau…" />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message as string}</p>}
      </div>

      <div className="space-y-1">
        <Label>Priorität</Label>
        <Select defaultValue="MEDIUM" onValueChange={(v) => setValue('priority', (v ?? 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Niedrig</SelectItem>
            <SelectItem value="MEDIUM">Mittel</SelectItem>
            <SelectItem value="HIGH">Hoch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? 'Wird gesendet…' : 'Meldung einreichen'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/tenant/tickets')}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
