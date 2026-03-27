'use client'

import { useState, useTransition, useRef } from 'react'
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
import { Camera, Upload, X, Home, Building2 } from 'lucide-react'

type Option = { propertyId: string; propertyName: string; unitId: string; unitNumber: string }

type Props = {
  options: Option[]
  action: (data: TicketFormValues) => Promise<ActionResult<Ticket>>
  backPath?: string
}

export function NewTicketForm({ options, action, backPath = '/tenant/tickets' }: Props) {
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema) as any,
    defaultValues: {
      priority: 'MEDIUM',
      scope: 'UNIT',
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        if (res.ok) {
          const { url } = await res.json()
          setImages(prev => [...prev, url])
        }
      } catch { /* ignore upload errors */ }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(url: string) {
    setImages(prev => prev.filter(u => u !== url))
  }

  function onSubmit(data: unknown) {
    setServerError(null)
    startTransition(async () => {
      const result = await action({ ...(data as TicketFormValues), images })
      if (result.success) {
        router.push(backPath)
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      {options.length > 0 && (
        <div className="space-y-1">
          <Label>Ihre Wohnung</Label>
          <Select defaultValue={options[0]?.unitId} onValueChange={(v) => handleOptionChange(v ?? '')}>
            <SelectTrigger>
              <SelectValue>
                {(value: string) => {
                  const opt = options.find(o => o.unitId === value)
                  return opt ? `${opt.propertyName} · ${opt.unitNumber}` : value
                }}
              </SelectValue>
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

      <div className="space-y-2">
        <Label>Betrifft</Label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'UNIT', label: 'Meine Wohnung', icon: Home },
            { value: 'BUILDING', label: 'Ganzes Gebäude', icon: Building2 },
          ] as const).map(({ value, label, icon: Icon }) => {
            const selected = watch('scope') === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setValue('scope', value)}
                className={[
                  'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                  selected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

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

      {/* Photo upload */}
      <div className="space-y-2">
        <Label>Fotos (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative h-20 w-20 rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Foto" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            {/* Camera (mobile: opens camera directly) */}
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
              <Camera className="h-5 w-5" />
              <span className="text-xs">Kamera</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
            {/* File picker */}
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
              <Upload className="h-5 w-5" />
              <span className="text-xs">Galerie</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
        {uploading && <p className="text-xs text-muted-foreground">Wird hochgeladen…</p>}
      </div>

      <div className="space-y-1">
        <Label>Priorität</Label>
        <Select value={watch('priority')} onValueChange={(v) => setValue('priority', (v ?? 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH')}>
          <SelectTrigger>
            <SelectValue>
              {(v: string) => ({ LOW: 'Niedrig', MEDIUM: 'Mittel', HIGH: 'Hoch' }[v] ?? v)}
            </SelectValue>
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
        <Button type="submit" disabled={pending || uploading} className="bg-primary hover:bg-primary/90">
          {pending ? 'Wird gesendet…' : 'Meldung einreichen'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(backPath)}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
