'use client'

// components/shared/ErrorState.tsx
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  nachricht?: string
  onRetry?: () => void
}

// Wiederverwendbarer Fehler-State
export function ErrorState({
  nachricht = 'Ein unerwarteter Fehler ist aufgetreten.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-card bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="font-serif text-xl text-foreground">Etwas ist schiefgelaufen</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{nachricht}</p>
      {onRetry && (
        <Button
          variant="outline"
          className="mt-5"
          onClick={onRetry}
        >
          Erneut versuchen
        </Button>
      )}
    </div>
  )
}
