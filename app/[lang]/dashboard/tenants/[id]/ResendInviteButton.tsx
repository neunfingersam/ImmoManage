'use client'

import { useState, useTransition } from 'react'
import { Mail, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { resendTenantInvite } from '../_actions'

export function ResendInviteButton({ tenantId }: { tenantId: string }) {
  const [pending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await resendTenantInvite(tenantId)
      if (result.success) {
        setSent(true)
        setTimeout(() => setSent(false), 5000)
      } else {
        setError(result.error ?? 'Fehler')
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={pending || sent}
      >
        {sent ? (
          <>
            <Check className="h-4 w-4 mr-2 text-green-600" />
            Einladung gesendet
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" />
            {pending ? 'Wird gesendet…' : 'Einladung erneut senden'}
          </>
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
