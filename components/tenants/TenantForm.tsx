'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { tenantSchema, type TenantFormValues } from '@/lib/schemas/tenant'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'
import type { ActionResult } from '@/lib/action-result'
import type { User } from '@/lib/generated/prisma'

type Props = {
  action: (data: TenantFormValues) => Promise<ActionResult<User>>
}

export function TenantForm({ action }: Props) {
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema) as any,
  })

  function onSubmit(data: unknown) {
    const formData = data as TenantFormValues
    setServerError(null)
    startTransition(async () => {
      const result = await action(formData)
      if (result.success) {
        router.push('/dashboard/tenants')
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} placeholder="Max Mustermann" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message as string}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Telefon (optional)</Label>
        <Input id="phone" {...register('phone')} placeholder="+41 79 123 45 67" />
      </div>

      {/* Invite info */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>Der Mieter erhält eine Einladungsmail und setzt sein Passwort selbst. Der Link ist 72 Stunden gültig.</p>
      </div>

      {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? 'Wird gespeichert…' : 'Mieter anlegen & einladen'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/dashboard/tenants')}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
