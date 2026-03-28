'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { CreditCard, Loader2 } from 'lucide-react'

export function PaymentRequiredWall() {
  const locale = useLocale()
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch(`/api/stripe/resume-checkout?locale=${locale}`, { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95">
      <div className="max-w-md w-full mx-4 rounded-2xl border p-8 text-center shadow-xl bg-card">
        <div
          className="inline-flex h-16 w-16 items-center justify-center rounded-full mb-4"
          style={{ backgroundColor: '#E8734A15' }}
        >
          <CreditCard className="h-8 w-8" style={{ color: '#E8734A' }} />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Zahlung erforderlich</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Dein Account ist erstellt — schliesse jetzt die Zahlung ab um loszulegen.
        </p>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#E8734A' }}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Jetzt bezahlen
        </button>
        <a
          href={`/${locale}/auth/login`}
          className="block mt-3 text-xs text-muted-foreground hover:underline"
        >
          Abmelden
        </a>
      </div>
    </div>
  )
}
