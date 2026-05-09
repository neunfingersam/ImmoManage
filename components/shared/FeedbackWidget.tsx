'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function FeedbackWidget() {
  const t = useTranslations('feedback')
  const categories = t.raw('categories') as string[]

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', category: '', description: '', name: '', email: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.category || !form.description) return
    setLoading(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } catch { /* silent */ }
    setLoading(false)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setForm({ title: '', category: '', description: '', name: '', email: '' })
      setOpen(false)
    }, 2200)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
        aria-label={t('button')}
      >
        <span className="text-base">💡</span>
        <span className="hidden sm:inline">{t('button')}</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md overflow-hidden rounded-t-2xl bg-background sm:rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <span className="font-semibold text-foreground">{t('title')}</span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent transition-colors text-lg"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[75dvh] overflow-y-auto px-5 py-4">
              {submitted ? (
                <div className="py-10 text-center">
                  <div className="mb-3 text-4xl">🎉</div>
                  <p className="font-semibold text-green-600">{t('successMsg')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('titleLabel')} *</label>
                    <input
                      required
                      placeholder={t('titlePlaceholder')}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('categoryLabel')} *</label>
                    <select
                      required
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">{t('categoryPlaceholder')}</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('descLabel')} *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder={t('descPlaceholder')}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('nameLabel')}</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('emailLabel')}</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
                  >
                    {loading ? t('submitting') : t('submit')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
