// app/403/page.tsx
import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-card bg-destructive/10 text-destructive">
        <ShieldX className="h-8 w-8" />
      </div>
      <h1 className="font-serif text-3xl text-foreground">Zugriff verweigert</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        Du hast keine Berechtigung, diese Seite aufzurufen. Bitte wende dich an
        deinen Administrator.
      </p>
      <Button render={<Link href="/" />} className="mt-6 bg-primary hover:bg-primary/90">
        Zurück zur Startseite
      </Button>
    </div>
  )
}
