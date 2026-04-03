'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import AnimateIn from '@/components/ui/AnimateIn'

export default function ForWhomSection() {
  const t = useTranslations('landing.forWhom')
  const seg1 = t.raw('segment1Points') as string[]
  const seg2 = t.raw('segment2Points') as string[]

  return (
    <section className="bg-[#FAFAF8] py-24">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <AnimateIn direction="up" delay={0}>
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest" style={{ color: '#E8734A' }}>
              Passt das zu mir?
            </p>
            <h2 className="font-heading text-4xl font-bold text-[#1A1A2E] md:text-5xl">
              {t('title')}
            </h2>
          </div>
        </AnimateIn>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Segment 1 — professional managers */}
          <AnimateIn direction="left" delay={0.15}>
            <div
              className="relative overflow-hidden rounded-3xl p-10"
              style={{
                background: 'linear-gradient(135deg, #E8734A 0%, #c45e35 100%)',
                boxShadow: '0 24px 64px rgba(232,115,74,0.25)',
              }}
            >
              {/* Background decoration */}
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
              />
              <p className="mb-1 text-2xl font-bold text-white">{t('segment1Title')}</p>
              <p className="mb-8 text-sm font-medium text-white/65">{t('segment1Subtitle')}</p>
              <ul className="space-y-4">
                {seg1.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-white/90 text-sm leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimateIn>

          {/* Segment 2 — private owners */}
          <AnimateIn direction="right" delay={0.25}>
            <div
              className="relative overflow-hidden rounded-3xl p-10 bg-white"
              style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
            >
              <p className="mb-1 text-2xl font-bold text-[#1A1A2E]">{t('segment2Title')}</p>
              <p className="mb-8 text-sm font-medium" style={{ color: '#E8734A' }}>{t('segment2Subtitle')}</p>
              <ul className="space-y-4">
                {seg2.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'rgba(232,115,74,0.12)' }}
                    >
                      <Check className="h-3 w-3" style={{ color: '#E8734A' }} strokeWidth={3} />
                    </div>
                    <span className="text-[#1A1A2E]/70 text-sm leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}
