'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-4 pb-1 border-b border-border">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{children}</h3>
    </div>
  )
}

export function LeaseForm({ units, tenants, action }: Props) {
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  const locale = useLocale()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LeaseFormValues>({
    resolver: zodResolver(leaseSchema) as any,
    defaultValues: {
      depositPaid: false,
      depositStatus: 'AUSSTEHEND',
      indexierung: false,
      noticePeriodMonths: 3,
    },
  })

  const unitId = watch('unitId')
  const tenantId = watch('tenantId')
  const depositPaid = watch('depositPaid')
  const indexierung = watch('indexierung')

  function onSubmit(data: unknown) {
    const formData = data as LeaseFormValues
    setServerError(null)
    startTransition(async () => {
      const result = await action(formData)
      if (result.success) {
        router.push(`/${locale}/dashboard/leases`)
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">

      {/* ── Mietobjekt & Mieter ── */}
      <SectionTitle>Mietobjekt &amp; Mieter</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Einheit</Label>
          <Select value={unitId ?? ''} onValueChange={(v) => setValue('unitId', v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Einheit wählen">
                {unitId ? (units.find(u => u.id === unitId)
                  ? `${units.find(u => u.id === unitId)!.property.name} · ${units.find(u => u.id === unitId)!.unitNumber}`
                  : unitId) : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.property.name} · {u.unitNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unitId && <p className="text-sm text-destructive">{errors.unitId.message as string}</p>}
        </div>

        <div className="space-y-1">
          <Label>Mieter</Label>
          <Select value={tenantId ?? ''} onValueChange={(v) => setValue('tenantId', v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Mieter wählen">
                {tenantId ? (tenants.find(t => t.id === tenantId)
                  ? `${tenants.find(t => t.id === tenantId)!.name} (${tenants.find(t => t.id === tenantId)!.email})`
                  : tenantId) : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name} ({t.email})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tenantId && <p className="text-sm text-destructive">{errors.tenantId.message as string}</p>}
        </div>
      </div>

      {/* ── Mietdauer ── */}
      <SectionTitle>Mietdauer</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="startDate">Mietbeginn *</Label>
          <Input id="startDate" type="date" {...register('startDate')} />
          {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message as string}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="endDate">Mietende (optional)</Label>
          <Input id="endDate" type="date" {...register('endDate')} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="noticePeriodMonths">Kündigungsfrist (Monate)</Label>
          <Input id="noticePeriodMonths" type="number" min={1} max={24} {...register('noticePeriodMonths')} />
          {errors.noticePeriodMonths && <p className="text-sm text-destructive">{errors.noticePeriodMonths.message as string}</p>}
        </div>
      </div>

      {/* ── Mietzins ── */}
      <SectionTitle>Mietzins &amp; Nebenkosten (CHF)</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="coldRent">Nettomiete (CHF/Mt.) *</Label>
          <Input id="coldRent" type="number" step="0.05" placeholder="0.00" {...register('coldRent')} />
          {errors.coldRent && <p className="text-sm text-destructive">{errors.coldRent.message as string}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="extraCosts">Nebenkosten à-konto (CHF/Mt.)</Label>
          <Input id="extraCosts" type="number" step="0.05" placeholder="0.00" {...register('extraCosts')} />
          {errors.extraCosts && <p className="text-sm text-destructive">{errors.extraCosts.message as string}</p>}
        </div>
      </div>

      {/* Index clause */}
      <div className="flex items-start gap-3 rounded-lg border border-border p-3 bg-muted/30">
        <input type="checkbox" id="indexierung" {...register('indexierung')} className="mt-1 rounded border-border" />
        <div>
          <Label htmlFor="indexierung" className="cursor-pointer">Indexklausel (Art. 269b OR)</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Mietzins wird an den Landesindex der Konsumentenpreise (LIK) gekoppelt.</p>
        </div>
      </div>
      {indexierung && (
        <div className="space-y-1">
          <Label htmlFor="referenzzinssatz">Referenzzinssatz bei Vertragsabschluss (%)</Label>
          <Input id="referenzzinssatz" type="number" step="0.25" min={0} max={20} placeholder="z.B. 1.75" {...register('referenzzinssatz')} />
          {errors.referenzzinssatz && <p className="text-sm text-destructive">{errors.referenzzinssatz.message as string}</p>}
        </div>
      )}

      {/* ── Kaution ── */}
      <SectionTitle>Kaution</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="depositAmount">Kautionsbetrag (CHF)</Label>
          <Input id="depositAmount" type="number" step="0.05" placeholder="z.B. 4500.00" {...register('depositAmount')} />
          <p className="text-xs text-muted-foreground">Max. 3 Monatsnettomieten (Art. 257e OR)</p>
          {errors.depositAmount && <p className="text-sm text-destructive">{errors.depositAmount.message as string}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="depositBank">Bank / Konto</Label>
          <Input id="depositAmount" placeholder="z.B. UBS Mietzinskaution" {...register('depositBank')} />
        </div>
        <div className="space-y-1">
          <Label>Status Kaution</Label>
          <Select defaultValue="AUSSTEHEND" onValueChange={(v) => setValue('depositStatus', v as 'AUSSTEHEND' | 'HINTERLEGT' | 'FREIGEGEBEN')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AUSSTEHEND">Ausstehend</SelectItem>
              <SelectItem value="HINTERLEGT">Hinterlegt</SelectItem>
              <SelectItem value="FREIGEGEBEN">Freigegeben</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="depositPaid" {...register('depositPaid')} className="rounded border-border" />
        <Label htmlFor="depositPaid" className="cursor-pointer">Kaution bereits erhalten / bestätigt</Label>
      </div>

      {/* ── Schlüsselübergabe ── */}
      <SectionTitle>Schlüsselübergabe</SectionTitle>

      <div className="space-y-1 max-w-xs">
        <Label htmlFor="keysCount">Anzahl übergebene Schlüssel</Label>
        <Input id="keysCount" type="number" min={0} placeholder="z.B. 2" {...register('keysCount')} />
        {errors.keysCount && <p className="text-sm text-destructive">{errors.keysCount.message as string}</p>}
      </div>

      {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? 'Wird gespeichert…' : 'Mietvertrag erstellen'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/${locale}/dashboard/leases`)}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
