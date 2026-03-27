'use client'

import { useTranslations } from 'next-intl'
import { Download } from 'lucide-react'

export function DataExportSection() {
  const t = useTranslations('dataExport')

  return (
    <div className="rounded-xl border bg-white p-5 space-y-3">
      <h2 className="font-semibold text-foreground">{t('title')}</h2>
      <p className="text-sm text-muted-foreground">{t('description')}</p>
      <a
        href="/api/user/export"
        download
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
      >
        <Download className="h-4 w-4" />
        {t('button')}
      </a>
    </div>
  )
}
