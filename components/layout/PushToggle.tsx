'use client'

import { useTranslations } from 'next-intl'
import { usePushSubscription } from '@/hooks/usePushSubscription'

export function PushToggle() {
  const t = useTranslations('push')
  const { supported, subscribed, subscribe, unsubscribe } = usePushSubscription()
  if (!supported) return null

  async function handleToggle() {
    if (subscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  return (
    <div className="flex items-center justify-between py-3 border-t">
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
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
  )
}
