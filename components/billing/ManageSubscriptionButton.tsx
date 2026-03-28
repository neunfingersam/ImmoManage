'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Loader2, CreditCard } from 'lucide-react'

export function ManageSubscriptionButton() {
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/stripe/portal?locale=${locale}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Fehler beim Öffnen des Portals')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: '#E8734A' }}
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <CreditCard className="h-4 w-4" />}
        Abo verwalten
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}
