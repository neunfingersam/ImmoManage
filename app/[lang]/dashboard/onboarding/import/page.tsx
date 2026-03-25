'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

type ImportState = 'idle' | 'importing' | 'done' | 'error'

export default function ImportPage() {
  const t = useTranslations('onboarding')
  const [state, setState] = useState<ImportState>('idle')
  const [errors, setErrors] = useState<string[]>([])
  const [result, setResult] = useState<{ propertiesCreated: number; tenantsCreated: number } | null>(null)
  const [file, setFile] = useState<File | null>(null)

  async function handleImport() {
    if (!file) return
    setState('importing')
    setErrors([])

    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch('/api/onboarding/import', { method: 'POST', body: fd })
    const data = await res.json()

    if (!res.ok) {
      setState('error')
      setErrors(data.errors ?? [data.error])
    } else {
      setState('done')
      setResult(data)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('importTitle')}</h1>
        <p className="text-muted-foreground mt-1">{t('importDescription')}</p>
      </div>

      {/* Schritt 1: Vorlage herunterladen */}
      <div className="border rounded-xl p-4">
        <h3 className="font-semibold mb-2">1. {t('downloadTemplate')}</h3>
        <a
          href="/templates/import-vorlage.xlsx"
          download
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          📥 import-vorlage.xlsx
        </a>
      </div>

      {/* Schritt 2: Datei hochladen */}
      <div className="border rounded-xl p-4">
        <h3 className="font-semibold mb-2">2. {t('uploadFile')}</h3>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
      </div>

      {/* Fehler */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="font-semibold text-red-700 dark:text-red-400 mb-2">Validierungsfehler:</p>
          <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
            {errors.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </div>
      )}

      {/* Erfolg */}
      {state === 'done' && result && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="font-semibold text-green-700 dark:text-green-400">Import erfolgreich!</p>
          <p className="text-sm text-green-600 dark:text-green-400">
            {result.propertiesCreated} Objekte und {result.tenantsCreated} Mieter importiert.
          </p>
        </div>
      )}

      <Button
        onClick={handleImport}
        disabled={!file || state === 'importing' || state === 'done'}
      >
        {state === 'importing' ? 'Importiere...' : t('import')}
      </Button>
    </div>
  )
}
