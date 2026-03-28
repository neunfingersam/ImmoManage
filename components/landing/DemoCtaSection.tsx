'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { ShieldCheck, CreditCard, CalendarClock } from 'lucide-react'

const trustItems = [
  { icon: ShieldCheck,    label: '14 Tage gratis testen' },
  { icon: CreditCard,     label: 'Keine Kreditkarte' },
  { icon: CalendarClock,  label: 'Monatlich kündbar' },
]

export default function DemoCtaSection() {
  const locale = useLocale()

  return (
    <section
      id="demo"
      className="relative overflow-hidden py-28"
      style={{ backgroundColor: '#1A1A2E' }}
    >
      {/* Glows */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[700px] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #E8734A 0%, transparent 65%)' }}
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        {/* Badge */}
        <span
          className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
          style={{ borderColor: 'rgba(232,115,74,0.35)', color: '#E8734A', backgroundColor: 'rgba(232,115,74,0.08)' }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          Jetzt starten — kostenlos
        </span>

        <h2 className="font-heading text-4xl font-bold text-white md:text-5xl lg:text-6xl leading-tight">
          Bereit, die Verwaltung{' '}
          <span style={{ color: '#E8734A' }}>zu modernisieren?</span>
        </h2>

        <p className="mt-6 text-lg text-white/50 max-w-xl mx-auto">
          Starte in wenigen Minuten. Keine IT-Kenntnisse nötig — immo-manage.ch läuft direkt im Browser.
        </p>

        {/* Trust items */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {trustItems.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2 text-sm text-white/50">
              <Icon className="h-4 w-4" style={{ color: '#E8734A' }} />
              {label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={`/${locale}/preise`}
            className="inline-flex items-center gap-2 rounded-2xl px-9 py-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0"
            style={{
              backgroundColor: '#E8734A',
              boxShadow: '0 8px 30px rgba(232,115,74,0.4)',
            }}
          >
            Pläne ansehen
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <a
            href="mailto:flaviopeter@immo-manage.ch"
            className="text-sm font-medium text-white/45 hover:text-white/70 transition-colors"
          >
            Fragen? Direkt schreiben →
          </a>
        </div>
      </div>
    </section>
  )
}
