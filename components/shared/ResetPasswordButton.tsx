'use client'

import { useState, useTransition } from 'react'
import { KeyRound, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sendPasswordResetLink } from '@/app/[lang]/dashboard/_admin-actions'

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await sendPasswordResetLink(userId)
      if (result.success) {
        setSent(true)
        setTimeout(() => setSent(false), 5000)
      } else {
        setError(result.error ?? 'Fehler')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending || sent}>
        {isPending ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : sent ? (
          <Check className="h-4 w-4 mr-1.5 text-green-600" />
        ) : (
          <KeyRound className="h-4 w-4 mr-1.5" />
        )}
        {sent ? 'Link gesendet' : 'Passwort-Link senden'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
