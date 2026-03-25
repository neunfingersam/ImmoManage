'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export function ReindexButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ success: number; failed: number; total: number } | null>(null)

  async function handleReindex() {
    setStatus('loading')
    try {
      const res = await fetch('/api/admin/reindex', { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResult(data)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleReindex}
        disabled={status === 'loading'}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
        {status === 'loading' ? 'Läuft...' : 'KI-Index neu aufbauen'}
      </button>
      {status === 'done' && result && (
        <span className="text-sm text-muted-foreground">
          {result.success} erfolgreich, {result.failed} fehlgeschlagen (gesamt: {result.total})
        </span>
      )}
      {status === 'error' && (
        <span className="text-sm text-destructive">Fehler beim Neuaufbau</span>
      )}
    </div>
  )
}
