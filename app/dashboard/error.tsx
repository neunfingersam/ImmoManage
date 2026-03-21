'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-[16px] bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="font-serif text-xl text-foreground">Etwas ist schiefgelaufen</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Erneut versuchen
        </button>
        <a
          href="/dashboard"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Zur Übersicht
        </a>
      </div>
    </div>
  )
}
