'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'
import { usePushSubscription } from '@/hooks/usePushSubscription'

export function PushToggle() {
  const t = useTranslations('push')
  const { supported, subscribed, subscribe, unsubscribe } = usePushSubscription()
  const [loading, setLoading] = useState(false)
  const [denied, setDenied] = useState(false)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)

  if (!supported) return null

  async function handleToggle() {
    setLoading(true)
    setDenied(false)
    setErrorDetail(null)
    if (subscribed) {
      await unsubscribe()
    } else {
      const result = await subscribe()
      if (result === 'denied') setDenied(true)
      else if (result.startsWith('error:')) setErrorDetail(result)
    }
    setLoading(false)
  }

  return (
    <div id="notifications" className="space-y-2 py-3 border-t">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t('title2')}</p>
          <p className="text-xs text-muted-foreground">
            {subscribed ? t('activeOnDevice') : t('inactiveOnDevice')}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={subscribed}
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait ${
            subscribed ? 'bg-primary' : 'bg-muted-foreground/30'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              subscribed ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {denied && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-destructive">{t('permissionDenied')}</p>
        </div>
      )}
      {errorDetail && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-destructive">{t('subscribeError')}</p>
            <p className="text-xs text-destructive/70 font-mono mt-0.5">{errorDetail}</p>
          </div>
        </div>
      )}
    </div>
  )
}
