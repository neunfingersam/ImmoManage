'use client'

import { usePushSubscription } from '@/hooks/usePushSubscription'

export function PushToggle() {
  const { supported, subscribed, subscribe, unsubscribe } = usePushSubscription()
  if (!supported) return null

  return (
    <div className="flex items-center justify-between py-3 border-t">
      <div>
        <p className="text-sm font-medium">Push-Mitteilungen</p>
        <p className="text-xs text-muted-foreground">
          {subscribed ? 'Aktiv auf diesem Gerät' : 'Deaktiviert auf diesem Gerät'}
        </p>
      </div>
      <button
        onClick={subscribed ? unsubscribe : subscribe}
        className={`text-xs rounded-lg px-3 py-1.5 font-medium transition-colors ${
          subscribed
            ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        }`}
      >
        {subscribed ? 'Deaktivieren' : 'Aktivieren'}
      </button>
    </div>
  )
}
