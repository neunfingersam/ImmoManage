'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createVermieter } from '../_actions'

export default function NewVermieterPage() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await createVermieter({
        name: fd.get('name') as string,
        email: fd.get('email') as string,
        password: fd.get('password') as string,
        phone: (fd.get('phone') as string) || undefined,
      })
      if (result.success) router.push('/dashboard/team')
      else setError(result.error)
    })
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-serif text-2xl text-foreground">Vermieter hinzufügen</h1>
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
            <Label htmlFor="phone">Telefon (optional)</Label>
            <Input id="phone" name="phone" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
              {pending ? 'Erstellen…' : 'Erstellen'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/team')}>
              Abbrechen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
