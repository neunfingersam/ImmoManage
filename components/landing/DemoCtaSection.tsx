'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'

export default function DemoCtaSection() {
  const t = useTranslations('landing.demo')
  const locale = useLocale()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [form, setForm] = useState({ name: '', email: '', message: '', consent: false })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const inputClass =
    'w-full rounded-xl border bg-white px-4 py-3.5 text-[#1A1A2E] placeholder-[#1A1A2E]/30 outline-none transition-all focus:ring-2 focus:ring-[#E8734A]/30 focus:border-[#E8734A]'

  return (
    <section id="demo" className="bg-[#FAFAF8] py-24">
      <div className="mx-auto max-w-2xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="font-heading text-4xl font-bold text-[#1A1A2E] md:text-5xl">
            {t('title')}
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full" style={{ backgroundColor: '#E8734A' }} />
          <p className="mt-6 text-lg text-[#1A1A2E]/55">{t('subtitle')}</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl bg-white p-8 md:p-10"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.07)', border: '1px solid #E8734A10' }}
        >
          {status === 'success' ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                style={{ backgroundColor: '#E8734A15' }}
              >
                ✓
              </div>
              <p className="text-lg font-medium text-[#1A1A2E]">{t('success')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder={t('namePlaceholder')}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputClass}
                style={{ borderColor: '#E8734A20' }}
              />
              <input
                type="email"
                required
                placeholder={t('emailPlaceholder')}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputClass}
                style={{ borderColor: '#E8734A20' }}
              />
              <textarea
                rows={3}
                placeholder={t('messagePlaceholder')}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className={inputClass}
                style={{ borderColor: '#E8734A20', resize: 'none' }}
              />
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={form.consent}
                  onChange={e => setForm(f => ({ ...f, consent: e.target.checked }))}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#E8734A]"
                />
                <span className="text-sm text-[#1A1A2E]/60 leading-relaxed">
                  {t.rich('consent', {
                    privacy: (chunks) => (
                      <Link href={`/${locale}/datenschutz`} className="underline hover:text-[#E8734A]" target="_blank">
                        {chunks}
                      </Link>
                    ),
                  })}
                </span>
              </label>
              {status === 'error' && (
                <p className="text-sm text-red-500">{t('error')}</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-xl py-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
                style={{ backgroundColor: '#E8734A', boxShadow: '0 4px 20px rgba(232,115,74,0.3)' }}
              >
                {status === 'loading' ? '...' : t('submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
