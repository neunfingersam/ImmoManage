'use client'

import { Trash2 } from 'lucide-react'

export function DocumentDeleteButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      onSubmit={(e) => {
        if (!confirm('Dokument wirklich löschen?')) e.preventDefault()
      }}
      action={action}
    >
      <button
        type="submit"
        className="text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Löschen"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  )
}
