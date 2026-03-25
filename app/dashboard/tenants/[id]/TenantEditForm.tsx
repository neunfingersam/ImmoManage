'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateTenantSchema, type UpdateTenantValues } from '@/lib/schemas/tenant'
import { updateTenant } from '../_actions'
import type { User } from '@/lib/generated/prisma'

export function TenantEditForm({ tenant }: { tenant: User }) {
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateTenantValues>({
    resolver: zodResolver(updateTenantSchema) as any,
    defaultValues: {
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone ?? '',
      whatsapp: tenant.whatsapp ?? '',
    },
  })

  function onSubmit(data: UpdateTenantValues) {
    setServerError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updateTenant(tenant.id, data)
      if (result.success) {
        setSuccess(true)
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message as string}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" {...register('phone')} placeholder="+49 123 456789" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input id="whatsapp" {...register('whatsapp')} placeholder="+49 123 456789" />
      </div>
      {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}
      {success && <p className="text-sm text-green-600">Gespeichert.</p>}
      <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
        {pending ? 'Wird gespeichert…' : 'Speichern'}
      </Button>
    </form>
  )
}
