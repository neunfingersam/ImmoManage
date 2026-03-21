'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { finalizeHandover } from '../_actions'

export function FinalizeButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFinalize() {
    setLoading(true)
    setError('')
    const result = await finalizeHandover(id)
    setLoading(false)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error ?? 'Fehler beim Abschließen')
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <button
        onClick={handleFinalize}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        <CheckCircle className="h-4 w-4" />
        {loading ? 'Wird abgeschlossen…' : 'Protokoll abschließen'}
      </button>
    </div>
  )
}
