'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function KiSummaryButton({ apiPath, label }: { apiPath: string; label: string }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    if (summary) { setSummary(null); setError(null); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiPath)
      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary)
      } else {
        setError('KI-Analyse nicht verfügbar')
      }
    } catch {
      setError('KI-Analyse nicht verfügbar')
    }
    setLoading(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {summary ? <X className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-primary" />}
        {loading ? 'KI analysiert…' : summary ? 'Ausblenden' : label}
      </button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {summary && (
        <Card className="mt-3 p-4 bg-secondary/50 border-primary/20">
          <p className="text-sm text-foreground leading-relaxed">{summary}</p>
        </Card>
      )}
    </div>
  )
}
