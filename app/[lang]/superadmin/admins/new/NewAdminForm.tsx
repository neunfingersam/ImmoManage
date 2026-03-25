'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createAdmin } from '../_actions'

interface Props {
  companies: { id: string; name: string }[]
}

export function NewAdminForm({ companies }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await createAdmin({
        name: fd.get('name') as string,
        email: fd.get('email') as string,
        password: fd.get('password') as string,
        companyId: fd.get('companyId') as string,
      })
      if (result.success) router.push('/superadmin/admins')
      else setError(result.error)
    })
  }

  return (
    <Card className="p-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Passwort</Label>
          <Input id="password" name="password" type="password" minLength={6} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="companyId">Unternehmen</Label>
          <select
            id="companyId"
            name="companyId"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— Unternehmen wählen —</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
            {pending ? 'Erstellen…' : 'Erstellen'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/superadmin/admins')}>
            Abbrechen
          </Button>
        </div>
      </form>
    </Card>
  )
}
