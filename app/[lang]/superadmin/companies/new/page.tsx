'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createCompany } from '../_actions'

export default function NewCompanyPage() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await createCompany({
        name: fd.get('name') as string,
        slug: fd.get('slug') as string,
      })
      if (result.success) router.push('/superadmin/companies')
      else setError(result.error)
    })
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-serif text-2xl text-foreground">Neue Company</h1>
      <Card className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Muster GmbH" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" placeholder="muster-gmbh" pattern="[a-z0-9-]+" required />
            <p className="text-xs text-muted-foreground">Nur Kleinbuchstaben, Zahlen, Bindestriche</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
              {pending ? 'Erstellen…' : 'Erstellen'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/superadmin/companies')}>
              Abbrechen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
