'use client'

import { useState } from 'react'
import { Check, Minus, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

const plans = [
  {
    key: 'STARTER',
    label: 'Starter',
    price: 0,
    priceNote: 'kostenlos',
    highlight: false,
    cta: 'Kostenlos starten',
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
    priceNote: 'pro Monat',
    highlight: false,
    cta: 'Jetzt anfragen',
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
    priceNote: 'pro Monat',
    highlight: true,
    cta: 'Jetzt anfragen',
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
    priceNote: 'auf Anfrage',
    highlight: false,
    cta: 'Kontakt aufnehmen',
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

const featureLabels: Record<string, string> = {
  properties: 'Objekte',
  units: 'Einheiten',
  users: 'Benutzer',
  tenantPortal: 'Mieter-Portal',
  tickets: 'Schadensmeldungen',
  documents: 'Dokumente & Vorlagen',
  qrInvoice: 'QR-Rechnung (CH)',
  taxFolder: 'Steuermappe',
  aiAssistant: 'KI-Assistent',
  support: 'Support',
}

interface ModalState {
  open: boolean
  planKey: string
  planLabel: string
}

interface FormState {
  name: string
  email: string
  phone: string
  company: string
  consent: boolean
}

const inputClass =
  'w-full rounded-xl border border-[#E8734A20] bg-white px-4 py-3 text-[#1A1A2E] placeholder-[#1A1A2E]/30 outline-none text-sm transition-all focus:ring-2 focus:ring-[#E8734A]/30 focus:border-[#E8734A]'

export default function PricingCards() {
  const locale = useLocale()
  const [modal, setModal] = useState<ModalState>({ open: false, planKey: '', planLabel: '' })
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', company: '', consent: false })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function openModal(planKey: string, planLabel: string) {
    setModal({ open: true, planKey, planLabel })
    setStatus('idle')
    setForm({ name: '', email: '', phone: '', company: '', consent: false })
  }

  function closeModal() {
    setModal(m => ({ ...m, open: false }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/plan-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan: modal.planKey }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

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
                Beliebteste Wahl
              </div>
            )}

            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1A1A2E]/40 mb-2">{plan.label}</p>
              <div className="flex items-baseline gap-1">
                {plan.price !== null ? (
                  <>
                    <span className="text-4xl font-bold text-[#1A1A2E]">CHF {plan.price}</span>
                    <span className="text-sm text-[#1A1A2E]/50">/Mt.</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-[#1A1A2E]">Auf Anfrage</span>
                )}
              </div>
              <p className="text-xs text-[#1A1A2E]/40 mt-1">{plan.priceNote}</p>
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {Object.entries(plan.features).map(([key, value]) => (
                <li key={key} className="flex items-start gap-2 text-sm text-[#1A1A2E]/70">
                  {typeof value === 'boolean' ? (
                    value ? (
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#E8734A' }} />
                    ) : (
                      <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#1A1A2E]/20" />
                    )
                  ) : (
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#E8734A' }} />
                  )}
                  <span>
                    <span className="text-[#1A1A2E]/40 text-xs">{featureLabels[key]}: </span>
                    {typeof value === 'boolean' ? (value ? 'Ja' : '—') : value}
                  </span>
                </li>
              ))}
            </ul>

            {plan.key === 'STARTER' ? (
              <Link
                href={`/${locale}/auth/login`}
                className="block text-center rounded-xl py-2.5 text-sm font-semibold transition-all"
                style={{ backgroundColor: '#E8734A10', color: '#E8734A' }}
              >
                {plan.cta}
              </Link>
            ) : (
              <button
                onClick={() => openModal(plan.key, plan.label)}
                className="block w-full text-center rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90"
                style={
                  plan.highlight
                    ? { backgroundColor: '#E8734A', color: '#fff' }
                    : { backgroundColor: '#E8734A10', color: '#E8734A' }
                }
              >
                {plan.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {/* Close */}
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-[#1A1A2E]/40 hover:bg-[#E8734A]/10 hover:text-[#E8734A] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {status === 'success' ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                  style={{ backgroundColor: '#E8734A15' }}
                >
                  ✓
                </div>
                <p className="text-lg font-semibold text-[#1A1A2E]">Anfrage gesendet!</p>
                <p className="text-sm text-[#1A1A2E]/60">Wir melden uns innerhalb von 24 Stunden bei Ihnen.</p>
                <button
                  onClick={closeModal}
                  className="mt-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
                  style={{ backgroundColor: '#E8734A' }}
                >
                  Schliessen
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <span
                    className="inline-block rounded-full px-3 py-1 text-xs font-bold text-white mb-3"
                    style={{ backgroundColor: '#E8734A' }}
                  >
                    {modal.planLabel}-Plan
                  </span>
                  <h2 className="text-xl font-bold text-[#1A1A2E]">Anfrage senden</h2>
                  <p className="text-sm text-[#1A1A2E]/55 mt-1">
                    Wir kontaktieren Sie innerhalb von 24 Stunden und richten Ihren Account ein.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    required
                    type="text"
                    placeholder="Ihr Name *"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={inputClass}
                  />
                  <input
                    required
                    type="email"
                    placeholder="E-Mail Adresse *"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className={inputClass}
                  />
                  <input
                    type="tel"
                    placeholder="Telefon (optional)"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Firma / Name der Verwaltung (optional)"
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    className={inputClass}
                  />

                  <label className="flex items-start gap-3 cursor-pointer pt-1">
                    <input
                      required
                      type="checkbox"
                      checked={form.consent}
                      onChange={e => setForm(f => ({ ...f, consent: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#E8734A]"
                    />
                    <span className="text-xs text-[#1A1A2E]/55 leading-relaxed">
                      Ich habe die{' '}
                      <Link href={`/${locale}/datenschutz`} target="_blank" className="underline hover:text-[#E8734A]">
                        Datenschutzerklärung
                      </Link>{' '}
                      gelesen und bin damit einverstanden, dass meine Daten zur Bearbeitung meiner Anfrage verwendet werden.
                    </span>
                  </label>

                  {status === 'error' && (
                    <p className="text-sm text-red-500">Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#E8734A' }}
                  >
                    {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                    {status === 'loading' ? 'Senden...' : 'Anfrage absenden'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
