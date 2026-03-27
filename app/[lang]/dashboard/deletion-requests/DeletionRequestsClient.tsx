'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { approveAccountDeletion, rejectAccountDeletion } from '@/lib/account-deletion-actions'

type Request = {
  id: string
  createdAt: Date
  reason: string | null
  user: {
    id: string
    name: string
    email: string
    role: string
    createdAt: Date
  }
}

export function DeletionRequestsClient({ requests }: { requests: Request[] }) {
  const t = useTranslations('deletion')
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  async function handleApprove(id: string) {
    setLoading(id)
    await approveAccountDeletion(id)
    setLoading(null)
    router.refresh()
  }

  async function handleReject(id: string) {
    setLoading(id)
    await rejectAccountDeletion(id, rejectReason || undefined)
    setLoading(null)
    setRejectModal(null)
    setRejectReason('')
    router.refresh()
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-muted-foreground">
        {t('adminEmpty')}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="rounded-xl border bg-white p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <p className="font-medium text-foreground">{req.user.name}</p>
              <p className="text-sm text-muted-foreground">{req.user.email}</p>
              <p className="text-xs text-muted-foreground">
                {t('requestedAt')} {new Date(req.createdAt).toLocaleDateString('de-CH')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(req.id)}
                disabled={loading === req.id}
                className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                {loading === req.id ? '...' : t('approve')}
              </button>
              <button
                onClick={() => { setRejectModal(req.id); setRejectReason('') }}
                disabled={loading === req.id}
                className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted disabled:opacity-60"
              >
                {t('reject')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="font-semibold text-lg">{t('rejectTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('rejectBody')}</p>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3}
              placeholder={t('rejectReasonPlaceholder')}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleReject(rejectModal)}
                disabled={loading === rejectModal}
                className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                {loading === rejectModal ? '...' : t('confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
