'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Share } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePushSubscription } from '@/hooks/usePushSubscription'

// Bump version to re-show banner for existing users
const DISMISSED_KEY = 'push_dismissed_v2'
const IOS_HINT_KEY = 'push_ios_hint_dismissed'

function isIos() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return ('standalone' in window.navigator && (window.navigator as any).standalone)
}

export function PushBanner() {
  const t = useTranslations('push')
  const { supported, subscribed, subscribe } = usePushSubscription()
  const [visible, setVisible] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    const ios = isIos()
    const standalone = isInStandaloneMode()

    // iOS not in standalone: show "add to home screen" hint
    if (ios && !standalone && !localStorage.getItem(IOS_HINT_KEY)) {
      const t = setTimeout(() => setShowIosHint(true), 1500)
      return () => clearTimeout(t)
    }

    // Normal push banner
    if (!supported || subscribed) return
    if (localStorage.getItem(DISMISSED_KEY)) return
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [supported, subscribed])

  // iOS hint banner
  if (showIosHint) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-sm">
        <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-3">
          <div className="shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Share className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground leading-snug">{t('title')}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t('iosHint')}</p>
          </div>
          <button
            onClick={() => { localStorage.setItem(IOS_HINT_KEY, '1'); setShowIosHint(false) }}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 -mt-0.5"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  if (!visible) return null

  async function handleAccept() {
    await subscribe()
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  function dismiss() {
    // Session-only dismiss — shows again on next login
    setVisible(false)
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-sm sm:max-w-md">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-3">
        <div className="shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground leading-snug">{t('title')}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t('body')}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={handleAccept}
              className="text-xs bg-primary text-primary-foreground rounded-lg px-3 py-1.5 font-medium hover:bg-primary/90 active:scale-95 transition-all"
            >
              {t('accept')}
            </button>
            <button
              onClick={dismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
            >
              {t('decline')}
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 -mt-0.5"
          aria-label="Schließen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
