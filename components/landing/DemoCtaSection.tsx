'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function DemoCtaSection() {
  const locale = useLocale()

  return (
    <section id="demo" className="bg-[#FAFAF8] py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="font-heading text-4xl font-bold text-[#1A1A2E] md:text-5xl">
          Bereit loszulegen?
        </h2>
        <div className="mx-auto mt-4 h-1 w-16 rounded-full" style={{ backgroundColor: '#E8734A' }} />
        <p className="mt-6 text-lg text-[#1A1A2E]/55">
          Wähle deinen Plan und starte noch heute — kostenlos testen, keine Kreditkarte erforderlich.
        </p>
        <div className="mt-10">
          <Link
            href={`/${locale}/preise`}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl"
            style={{ backgroundColor: '#E8734A', boxShadow: '0 4px 20px rgba(232,115,74,0.3)' }}
          >
            Pläne & Preise ansehen →
          </Link>
        </div>
      </div>
    </section>
  )
}
