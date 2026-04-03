'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushSubscription } from '@/hooks/usePushSubscription'

// Bump version to re-show banner for existing users
const DISMISSED_KEY = 'push_dismissed_v2'

export function PushBanner() {
  const { supported, subscribed, subscribe } = usePushSubscription()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!supported || subscribed) return
    if (localStorage.getItem(DISMISSED_KEY)) return
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [supported, subscribed])

  if (!visible) return null

  async function handleAccept() {
    const ok = await subscribe()
    if (ok || Notification.permission === 'denied') {
      localStorage.setItem(DISMISSED_KEY, '1')
      setVisible(false)
    }
  }

  function dismiss() {
    // Only dismiss for this session — show again next login
    setVisible(false)
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-3">
        <div className="shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">Push-Mitteilungen aktivieren?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Wir benachrichtigen dich bei neuen Nachrichten, Terminen und Meldungen.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAccept}
              className="text-xs bg-primary text-primary-foreground rounded-lg px-3 py-1.5 font-medium hover:bg-primary/90 transition-colors"
            >
              Jetzt aktivieren
            </button>
            <button
              onClick={dismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
            >
              Nein danke
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
