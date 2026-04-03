'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'

const plans = [
  {
    key: 'starter',
    name: 'Starter',
    price: 19,
    trialMonths: 3,
    highlighted: false,
    features: [
      '1 Objekt · 1–4 Einheiten',
      '1 Benutzer',
      'Mieter-Portal',
      'Dokumente & Tickets',
    ],
  },
  {
    key: 'standard',
    name: 'Standard',
    price: 39,
    trialMonths: 2,
    highlighted: false,
    features: [
      '2–5 Objekte · 5–25 Einheiten',
      '1–2 Benutzer',
      'QR-Rechnung (CH)',
      'Mieter-Portal + Dokumente',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 79,
    trialMonths: 1,
    highlighted: true,
    features: [
      '6–20 Objekte · 26–100 Einheiten',
      '2–5 Benutzer',
      'QR-Rechnung + Steuermappe',
      'KI-Assistent',
      'Übergabeprotokoll',
    ],
  },
] as const

export default function PricingPreviewSection() {
  const locale = useLocale()

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="mb-16 text-center">
          <p
            className="mb-3 text-sm font-semibold uppercase tracking-widest"
            style={{ color: '#E8734A' }}
          >
            Transparente Preise
          </p>
          <h2 className="font-heading text-4xl font-bold text-[#1A1A2E] md:text-5xl">
            Einfach. Fair. Schweizer Qualität.
          </h2>
          <p className="mt-4 text-base text-[#1A1A2E]/55">
            Alle Preise in CHF, inkl. MwSt. Monatlich kündbar — ohne Mindestlaufzeit.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className="relative flex flex-col rounded-3xl bg-[#FAFAF8] p-8"
              style={
                plan.highlighted
                  ? {
                      border: '2px solid #E8734A',
                      boxShadow: '0 8px 40px rgba(232,115,74,0.18)',
                    }
                  : {
                      border: '1px solid rgba(0,0,0,0.07)',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                    }
              }
            >
              {/* "Beliebteste Wahl" badge for highlighted plan */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span
                    className="rounded-full px-4 py-1.5 text-xs font-bold text-white whitespace-nowrap"
                    style={{ backgroundColor: '#E8734A' }}
                  >
                    Beliebteste Wahl
                  </span>
                </div>
              )}

              {/* Plan name */}
              <p className="mb-1 text-lg font-bold text-[#1A1A2E]">{plan.name}</p>

              {/* Price */}
              <div className="mb-4 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-[#1A1A2E]">
                  CHF {plan.price}
                </span>
                <span className="mb-1 text-sm text-[#1A1A2E]/50">/Mt.</span>
              </div>

              {/* Free trial badge */}
              <div className="mb-6">
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: 'rgba(232,115,74,0.10)',
                    color: '#E8734A',
                  }}
                >
                  {plan.trialMonths} Monate gratis
                </span>
              </div>

              {/* Feature list */}
              <ul className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'rgba(232,115,74,0.12)' }}
                    >
                      <Check
                        className="h-3 w-3"
                        style={{ color: '#E8734A' }}
                        strokeWidth={3}
                      />
                    </div>
                    <span className="text-sm leading-relaxed text-[#1A1A2E]/70">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href={`/${locale}/preise`}
            className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#E8734A' }}
          >
            Alle Pläne vergleichen
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Trust items */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
          {[
            { icon: '🔒', text: 'Keine Kreditkarte' },
            { icon: '🇨🇭', text: 'Schweizer Server' },
            { icon: '↩', text: 'Monatlich kündbar' },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 text-sm text-[#1A1A2E]/55"
            >
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
