'use client'

import { useState } from 'react'
import { requestAccountDeletion } from '@/lib/account-deletion-actions'
import { Trash2, Loader2 } from 'lucide-react'

export function RequestDeletionButton({ alreadyRequested }: { alreadyRequested: boolean }) {
  const [requested, setRequested] = useState(alreadyRequested)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleRequest() {
    setStatus('loading')
    setErrorMsg('')
    const result = await requestAccountDeletion()
    if (result.success) {
      setRequested(true)
      setShowConfirm(false)
    } else {
      setErrorMsg(
        result.error === 'active_subscription'
          ? 'Du hast noch ein aktives Abonnement. Bitte kündige es zuerst über den Button oben.'
          : result.error === 'already_requested'
          ? 'Du hast bereits eine Löschanfrage gestellt.'
          : 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.'
      )
      setStatus('error')
    }
  }

  if (requested) {
    return (
      <div className="rounded-xl px-4 py-3 text-sm bg-amber-50 border border-amber-200 text-amber-800">
        Deine Löschanfrage wurde eingereicht und wartet auf Bestätigung durch den Superadmin.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-sm font-medium text-destructive underline underline-offset-2 hover:opacity-80"
        >
          Account & Company löschen beantragen
        </button>
      ) : (
        <div className="rounded-xl border border-destructive/20 bg-red-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-destructive">Bist du sicher?</p>
          <p className="text-xs text-muted-foreground">
            Deine Anfrage wird an den Superadmin gesendet. Nach Bestätigung werden dein Account und deine Company dauerhaft deaktiviert. Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleRequest}
              disabled={status === 'loading'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {status === 'loading' && <Loader2 className="h-3 w-3 animate-spin" />}
              <Trash2 className="h-3 w-3" />
              Ja, Löschung beantragen
            </button>
            <button
              onClick={() => { setShowConfirm(false); setStatus('idle'); setErrorMsg('') }}
              className="rounded-lg border px-4 py-2 text-xs font-medium hover:bg-muted"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
