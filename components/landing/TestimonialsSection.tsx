'use client'

import { useTranslations } from 'next-intl'
import { Star } from 'lucide-react'
import AnimateIn from '@/components/ui/AnimateIn'

const testimonials = [
  { key: 't1', initials: 'MH', color: '#E8734A' },
  { key: 't2', initials: 'SK', color: '#3b82f6' },
  { key: 't3', initials: 'AP', color: '#16a34a' },
] as const

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(count)].map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-current" style={{ color: '#E8734A' }} />
      ))}
    </div>
  )
}

export default function TestimonialsSection() {
  const t = useTranslations('landing.testimonials')

  return (
    <section className="py-24" style={{ backgroundColor: '#1A1A2E' }}>
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <AnimateIn direction="up" delay={0}>
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest" style={{ color: '#E8734A' }}>
              Kundenstimmen
            </p>
            <h2 className="font-heading text-4xl font-bold text-white md:text-5xl">
              {t('title')}
            </h2>
            <p className="mt-4 text-white/45">{t('subtitle')}</p>
          </div>
        </AnimateIn>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map(({ key, initials, color }, index) => (
            <AnimateIn key={key} direction="up" delay={index * 0.12}>
              <div
                className="flex flex-col rounded-2xl p-7"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Stars */}
                <Stars />

                {/* Big quote mark */}
                <div
                  className="mt-4 mb-2 font-serif text-6xl leading-none select-none"
                  style={{ color: '#E8734A', opacity: 0.4 }}
                  aria-hidden
                >
                  &ldquo;
                </div>

                {/* Quote */}
                <p className="flex-1 text-white/75 leading-relaxed text-sm">
                  {t(`${key}Quote` as 't1Quote' | 't2Quote' | 't3Quote')}
                </p>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {t(`${key}Name` as 't1Name' | 't2Name' | 't3Name')}
                    </p>
                    <p className="text-xs text-white/40">
                      {t(`${key}Role` as 't1Role' | 't2Role' | 't3Role')}
                    </p>
                  </div>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>

        {/* Aggregate */}
        <AnimateIn direction="up" delay={0.4}>
          <div className="mt-12 flex items-center justify-center gap-3">
            <Stars />
            <span className="text-sm font-bold text-white">4.8 / 5</span>
            <span className="text-sm text-white/35">{t('ratingLabel')}</span>
          </div>
        </AnimateIn>
      </div>
    </section>
  )
}
