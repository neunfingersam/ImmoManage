'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Users, Gift, Headphones } from 'lucide-react'
import AnimateIn from '@/components/ui/AnimateIn'

const perks = [
  {
    icon: Gift,
    title: '3 Monate kostenlos',
    desc: 'Voller Zugang zum Pro-Plan — ohne Kreditkarte, ohne Risiko.',
  },
  {
    icon: Headphones,
    title: 'Persönliches Onboarding',
    desc: 'Wir richten alles gemeinsam ein. 1:1 via Video oder Telefon.',
  },
  {
    icon: Users,
    title: 'Direkter Einfluss',
    desc: 'Dein Feedback formt das Produkt. Pilotkunden entscheiden mit.',
  },
]

export default function PilotSection() {
  const locale = useLocale()

  return (
    <section className="py-24 bg-[#FAFAF8]">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <AnimateIn direction="up" delay={0}>
          <div className="mb-4 flex justify-center">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
              style={{ borderColor: '#E8734A40', color: '#E8734A', backgroundColor: '#E8734A10' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              Pilotkunden gesucht — 10 Plätze verfügbar
            </span>
          </div>
          <div className="mb-16 text-center">
            <h2 className="font-heading text-4xl font-bold text-[#1A1A2E] md:text-5xl">
              Sei unter den Ersten.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-[#1A1A2E]/50">
              ImmoManage ist neu — und wir suchen Hausverwaltungen und Vermieter, die gemeinsam mit uns wachsen wollen. Als Pilotkunde profitierst du direkt.
            </p>
          </div>
        </AnimateIn>

        {/* Perks */}
        <div className="grid gap-6 md:grid-cols-3 mb-14">
          {perks.map(({ icon: Icon, title, desc }, index) => (
            <AnimateIn key={title} direction="up" delay={index * 0.1}>
              <div
                className="rounded-2xl bg-white p-8"
                style={{ border: '1px solid rgba(0,0,0,0.07)' }}
              >
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: '#E8734A12' }}
                >
                  <Icon className="h-5 w-5" style={{ color: '#E8734A' }} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-[#1A1A2E]">{title}</h3>
                <p className="text-sm leading-relaxed text-[#1A1A2E]/55">{desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>

        {/* CTA */}
        <AnimateIn direction="up" delay={0.35}>
          <div className="text-center">
            <a
              href="mailto:flaviopeter@immo-manage.ch?subject=Pilotkunde%20werden&body=Hallo%20Flavio%2C%0A%0Aich%20interessiere%20mich%20f%C3%BCr%20das%20Pilotprogramm.%0A%0AMein%20Name%3A%0AAnzahl%20verwaltete%20Einheiten%3A%0ATelefon%20(optional)%3A"
              className="inline-flex items-center gap-2 rounded-2xl px-9 py-4 text-base font-semibold text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl active:translate-y-0"
              style={{ backgroundColor: '#E8734A', boxShadow: '0 8px 30px rgba(232,115,74,0.35)' }}
            >
              Jetzt Pilotkunde werden — kostenlos
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <p className="mt-4 text-xs text-[#1A1A2E]/35">
              Direkt per E-Mail — kein Formular, keine Warteliste. Wir melden uns innert 24h.
            </p>
          </div>
        </AnimateIn>
      </div>
    </section>
  )
}
