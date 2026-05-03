'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'

export function DocumentSummaryButton({ docId }: { docId: string }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (summary) { setSummary(null); setError(null); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/agent/summarize-document/${docId}`)
      if (res.ok) {
        const { summary: s } = await res.json()
        setSummary(s)
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? `KI-Analyse nicht verfügbar (${res.status})`)
      }
    } catch (e) {
      setError('KI-Analyse nicht verfügbar: ' + (e instanceof Error ? e.message : String(e)))
    }
    setLoading(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={load}
        disabled={loading}
        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="KI-Zusammenfassung"
      >
        {summary ? <X className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
        {loading ? 'Analysiere…' : summary ? 'Ausblenden' : 'KI-Zusammenfassung'}
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      {summary && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{summary}</p>
      )}
    </div>
  )
}
