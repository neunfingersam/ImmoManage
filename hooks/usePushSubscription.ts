'use client'

import { useState, useEffect } from 'react'

export type SubscribeResult = 'ok' | 'denied' | 'error'

export function usePushSubscription() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // On iOS, Web Push only works for home screen apps (standalone PWA).
      // Regular Safari reports PushManager as available but subscribe() throws.
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true
      if (isIos && !isStandalone) return

      setSupported(true)
      navigator.serviceWorker.getRegistration('/sw.js').then((reg) => {
        if (!reg) return
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub)
        })
      })
    }
  }, [])

  async function subscribe(): Promise<SubscribeResult> {
    try {
      // Must be the very first await to preserve the browser user-gesture context
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return 'denied'

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured')
        return 'error'
      }

      const reg = await navigator.serviceWorker.register('/sw.js')

      // waitForActive avoids navigator.serviceWorker.ready hanging when the SW
      // is still in the installing/waiting state
      const activeReg = await waitForActive(reg)

      const sub = await activeReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) {
        console.error('[Push] API returned', res.status)
        return 'error'
      }

      setSubscribed(true)
      return 'ok'
    } catch (err) {
      console.error('[Push] Subscribe error:', err)
      return 'error'
    }
  }

  async function unsubscribe(): Promise<void> {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (!reg) return
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return

      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })

      await sub.unsubscribe()
      setSubscribed(false)
    } catch (err) {
      console.error('[Push] Unsubscribe error:', err)
    }
  }

  return { supported, subscribed, subscribe, unsubscribe }
}

/**
 * Waits for a ServiceWorkerRegistration to have an active worker.
 * Unlike `navigator.serviceWorker.ready` this includes a 10-second timeout
 * and listens to statechange events so it doesn't hang indefinitely.
 */
async function waitForActive(reg: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> {
  if (reg.active) return reg

  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Service Worker activation timed out')),
      10_000,
    )

    const sw = reg.installing ?? reg.waiting
    if (!sw) {
      // No worker in progress — fall back to global ready (should resolve fast)
      clearTimeout(timeout)
      navigator.serviceWorker.ready.then(resolve, reject)
      return
    }

    // Capture as non-null since we checked above
    const activatingSW = sw as ServiceWorker

    function onStateChange() {
      if (activatingSW.state === 'activated') {
        clearTimeout(timeout)
        activatingSW.removeEventListener('statechange', onStateChange)
        resolve(reg)
      } else if (activatingSW.state === 'redundant') {
        clearTimeout(timeout)
        activatingSW.removeEventListener('statechange', onStateChange)
        reject(new Error('Service Worker became redundant'))
      }
    }

    activatingSW.addEventListener('statechange', onStateChange)
  })
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)))
}
