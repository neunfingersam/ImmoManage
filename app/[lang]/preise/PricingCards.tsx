'use client'

import { useState } from 'react'
import { Check, Minus, X, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const plans = [
  {
    key: 'STARTER',
    label: 'Starter',
    price: 19,
    trial: true,
    trialMonths: 3,
    highlight: false,
    features: {
      properties: '1 Objekt',
      units: 'bis 4 Einheiten',
      users: '1 Benutzer',
      tenantPortal: true,
      tickets: true,
      documents: true,
      qrInvoice: false,
      taxFolder: false,
      aiAssistant: false,
      support: 'Community',
    },
  },
  {
    key: 'STANDARD',
    label: 'Standard',
    price: 39,
    trial: true,
    trialMonths: 2,
    highlight: false,
    features: {
      properties: 'bis 5 Objekte',
      units: 'bis 25 Einheiten',
      users: '2 Benutzer',
      tenantPortal: true,
      tickets: true,
      documents: true,
      qrInvoice: true,
      taxFolder: false,
      aiAssistant: false,
      support: 'E-Mail',
    },
  },
  {
    key: 'PRO',
    label: 'Pro',
    price: 79,
    trial: true,
    trialMonths: 1,
    highlight: true,
    features: {
      properties: 'unbegrenzt',
      units: 'unbegrenzt',
      users: 'bis 5 Benutzer',
      tenantPortal: true,
      tickets: true,
      documents: true,
      qrInvoice: true,
      taxFolder: true,
      aiAssistant: true,
      support: 'Priorität',
    },
  },
  {
    key: 'ENTERPRISE',
    label: 'Enterprise',
    price: null,
    trial: false,
    highlight: false,
    features: {
      properties: 'unbegrenzt',
      units: 'unbegrenzt',
      users: 'unbegrenzt',
      tenantPortal: true,
      tickets: true,
      documents: true,
      qrInvoice: true,
      taxFolder: true,
      aiAssistant: true,
      support: 'Dediziert',
    },
  },
]

const inputClass =
  'w-full rounded-xl border border-[#E8734A20] bg-white px-4 py-3 text-[#1A1A2E] placeholder-[#1A1A2E]/30 outline-none text-sm transition-all focus:ring-2 focus:ring-[#E8734A]/30 focus:border-[#E8734A]'

export default function PricingCards() {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations('pricing')

  const featureLabels: Record<string, string> = {
    properties: t('featProperties'),
    units: t('featUnits'),
    users: t('featUsers'),
    tenantPortal: t('featTenantPortal'),
    tickets: t('featTickets'),
    documents: t('featDocuments'),
    qrInvoice: t('featQrInvoice'),
    taxFolder: t('featTaxFolder'),
    aiAssistant: t('featAiAssistant'),
    support: t('featSupport'),
  }

  const [modalPlan, setModalPlan] = useState<{ key: string; label: string; trial: boolean; trialMonths?: number } | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '', consent: false })
  const [showPw, setShowPw] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function openModal(key: string, label: string, trial: boolean, trialMonths?: number) {
    setModalPlan({ key, label, trial, trialMonths })
    setStatus('idle')
    setErrorMsg('')
    setForm({ name: '', email: '', password: '', companyName: '', consent: false })
  }

  function closeModal() {
    setModalPlan(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    // Enterprise → just send contact request, no account creation
    if (modalPlan?.key === 'ENTERPRISE') {
      try {
        const res = await fetch('/api/plan-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            company: form.companyName,
            plan: 'ENTERPRISE',
            consent: form.consent,
          }),
        })
        if (!res.ok) throw new Error()
        closeModal()
        alert(t('errorContact'))
      } catch {
        setErrorMsg(t('errorSend'))
        setStatus('error')
      }
      return
    }

    // STANDARD / PRO / STARTER → self-registration
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan: modalPlan?.key }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? t('errorGeneric'))
        setStatus('error')
        return
      }

      // Auto-login first
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout for payment / card setup
        window.location.href = data.checkoutUrl
      } else if (result?.ok) {
        router.push(`/${locale}/dashboard`)
      } else {
        closeModal()
        router.push(`/${locale}/auth/login?registered=1`)
      }
    } catch {
      setErrorMsg(t('errorGeneric'))
      setStatus('error')
    }
  }

  const isEnterprise = modalPlan?.key === 'ENTERPRISE'
  const isTrialModal = modalPlan?.trial === true

  return (
    <>
      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className="relative rounded-2xl border p-6 flex flex-col bg-white"
            style={{
              borderColor: plan.highlight ? '#E8734A' : '#E8734A20',
              boxShadow: plan.highlight ? '0 8px 40px rgba(232,115,74,0.15)' : '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            {plan.highlight && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold text-white whitespace-nowrap"
                style={{ backgroundColor: '#E8734A' }}
              >
                {t('mostPopular')}
              </div>
            )}

            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1A1A2E]/40 mb-2">{plan.label}</p>

              {plan.trial ? (
                <>
                  {/* Trial badge */}
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white mb-2"
                    style={{ backgroundColor: '#E8734A' }}
                  >
                    {plan.trialMonths} {plan.trialMonths === 1 ? 'Monat' : 'Monate'} gratis testen
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-bold text-[#1A1A2E]">CHF 0</span>
                    <span className="text-sm text-[#1A1A2E]/50">{t('perMonth')}</span>
                  </div>
                  <p className="text-xs text-[#1A1A2E]/40 mt-1">
                    danach CHF {plan.price}/Monat
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    {plan.price !== null ? (
                      <>
                        <span className="text-4xl font-bold text-[#1A1A2E]">CHF {plan.price}</span>
                        <span className="text-sm text-[#1A1A2E]/50">{t('perMonth')}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-[#1A1A2E]">{t('onRequest')}</span>
                    )}
                  </div>
                  {plan.price !== null && (
                    <p className="text-xs text-[#1A1A2E]/40 mt-1">{t('monthly')}</p>
                  )}
                </>
              )}
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {Object.entries(plan.features).map(([key, value]) => (
                <li key={key} className="flex items-start gap-2 text-sm text-[#1A1A2E]/70">
                  {typeof value === 'boolean' ? (
                    value
                      ? <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#E8734A' }} />
                      : <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#1A1A2E]/20" />
                  ) : (
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#E8734A' }} />
                  )}
                  <span>
                    <span className="text-[#1A1A2E]/40 text-xs">{featureLabels[key]}: </span>
                    {typeof value === 'boolean' ? (value ? t('yes') : '—') : value}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => openModal(plan.key, plan.label, plan.trial, (plan as any).trialMonths)}
              className="block w-full text-center rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90"
              style={
                plan.highlight
                  ? { backgroundColor: '#E8734A', color: '#fff' }
                  : { backgroundColor: '#E8734A10', color: '#E8734A' }
              }
            >
              {plan.key === 'STARTER'
                ? t('starterCta')
                : plan.key === 'ENTERPRISE'
                  ? t('contactCta')
                  : t('registerCta')}
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl my-8">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-[#1A1A2E]/40 hover:bg-[#E8734A]/10 hover:text-[#E8734A] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-bold text-white mb-3"
                style={{ backgroundColor: '#E8734A' }}
              >
                {modalPlan.label}-Plan
              </span>
              <h2 className="text-xl font-bold text-[#1A1A2E]">
                {isEnterprise ? t('modalTitleEnterprise') : t('modalTitle')}
              </h2>
              <p className="text-sm text-[#1A1A2E]/55 mt-1">
                {isEnterprise
                  ? t('modalSubtitleEnterprise')
                  : isTrialModal
                    ? `${modalPlan.trialMonths} ${modalPlan.trialMonths === 1 ? 'Monat' : 'Monate'} gratis — keine Kreditkarte erforderlich.`
                    : t('modalSubtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                type="text"
                placeholder={t('nameLabel')}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputClass}
              />
              <input
                required
                type="email"
                placeholder={t('emailLabel')}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputClass}
              />
              {!isEnterprise && (
                <>
                  <div className="relative">
                    <input
                      required
                      type={showPw ? 'text' : 'password'}
                      placeholder={t('passwordLabel')}
                      minLength={6}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className={inputClass + ' pr-11'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1A2E]/30 hover:text-[#1A1A2E]/60"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <input
                    required
                    type="text"
                    placeholder={t('companyLabel')}
                    value={form.companyName}
                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    className={inputClass}
                  />
                </>
              )}

              <label className="flex items-start gap-3 cursor-pointer pt-1">
                <input
                  required
                  type="checkbox"
                  checked={form.consent}
                  onChange={e => setForm(f => ({ ...f, consent: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#E8734A]"
                />
                <span className="text-xs text-[#1A1A2E]/55 leading-relaxed">
                  {t.rich('consentText', {
                    privacy: (chunks) => (
                      <Link href={`/${locale}/datenschutz`} target="_blank" className="underline hover:text-[#E8734A]">
                        {chunks}
                      </Link>
                    ),
                  })}
                </span>
              </label>

              {errorMsg && (
                <p className="text-sm text-red-500 rounded-lg bg-red-50 px-3 py-2">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                style={{ backgroundColor: '#E8734A' }}
              >
                {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                {status === 'loading'
                  ? isEnterprise ? t('submittingEnterprise') : t('submitting')
                  : isEnterprise ? t('submitBtnEnterprise') : t('submitBtn')}
              </button>

              {!isEnterprise && (
                <p className="text-center text-xs text-[#1A1A2E]/40 pt-1">
                  {t('alreadyRegistered')}{' '}
                  <Link href={`/${locale}/auth/login`} className="underline hover:text-[#E8734A]">
                    {t('signIn')}
                  </Link>
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}
