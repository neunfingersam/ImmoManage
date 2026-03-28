'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { AlertCircle } from 'lucide-react'

interface TrialBannerProps {
  trialEndsAt: string | null  // ISO string
  planStatus: string
}

export function TrialBanner({ trialEndsAt, planStatus }: TrialBannerProps) {
  const locale = useLocale()

  if (planStatus !== 'TRIAL' || !trialEndsAt) return null

  const daysLeft = Math.max(0, Math.ceil(
    (new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ))

  const isUrgent = daysLeft <= 7

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
      style={{
        backgroundColor: isUrgent ? '#FEF2F2' : '#FFF7ED',
        borderBottom: `1px solid ${isUrgent ? '#FECACA' : '#FED7AA'}`,
        color: isUrgent ? '#991B1B' : '#92400E',
      }}
    >
      <span className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {daysLeft === 0
          ? 'Ihre Testphase endet heute.'
          : `Noch ${daysLeft} Tag${daysLeft === 1 ? '' : 'e'} gratis — danach CHF 19/Monat.`}
      </span>
      <Link
        href={`/${locale}/preise`}
        className="shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition-colors hover:opacity-80"
        style={{
          backgroundColor: isUrgent ? '#EF4444' : '#E8734A',
          color: '#fff',
        }}
      >
        Plan wählen
      </Link>
    </div>
  )
}
