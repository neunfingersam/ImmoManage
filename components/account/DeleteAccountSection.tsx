'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { requestAccountDeletion } from '@/lib/account-deletion-actions'

type Props = {
  hasActiveLease: boolean
  alreadyRequested: boolean
}

export function DeleteAccountSection({ hasActiveLease, alreadyRequested }: Props) {
  const t = useTranslations('deletion')
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorCode, setErrorCode] = useState<string | undefined>()
  const [requested, setRequested] = useState(alreadyRequested)

  async function handleRequest() {
    setStatus('loading')
    const result = await requestAccountDeletion()
    if (result.success) {
      setRequested(true)
      setStatus('done')
      setShowConfirm(false)
    } else {
      setErrorCode(result.error)
      setStatus('error')
    }
  }

  return (
    <div className="border border-destructive/30 rounded-xl p-5 space-y-3 bg-destructive/5">
      <h2 className="font-semibold text-destructive">{t('title')}</h2>

      {hasActiveLease ? (
        <p className="text-sm text-muted-foreground">{t('hasActiveLease')}</p>
      ) : requested ? (
        <p className="text-sm text-muted-foreground">{t('alreadyRequested')}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-sm font-medium text-destructive underline underline-offset-2 hover:opacity-80"
            >
              {t('request')}
            </button>
          ) : (
            <div className="space-y-3 border border-destructive/20 rounded-lg p-4 bg-white">
              <p className="text-sm font-medium text-foreground">{t('confirmTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('confirmBody')}</p>
              {status === 'error' && (
                <p className="text-sm text-destructive">
                  {errorCode === 'active_subscription'
                    ? 'Du hast ein aktives Abonnement. Bitte kündige zuerst dein Abo unter "Abo & Plan".'
                    : t('error')}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleRequest}
                  disabled={status === 'loading'}
                  className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
                >
                  {status === 'loading' ? '...' : t('confirm')}
                </button>
                <button
                  onClick={() => { setShowConfirm(false); setStatus('idle') }}
                  className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
