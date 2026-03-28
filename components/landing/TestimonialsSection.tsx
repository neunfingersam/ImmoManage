import { useTranslations } from 'next-intl'
import { Star } from 'lucide-react'

const testimonials = [
  { key: 't1', initials: 'MH', color: '#E8734A' },
  { key: 't2', initials: 'SK', color: '#1A1A2E' },
  { key: 't3', initials: 'AP', color: '#16a34a' },
] as const

function Stars() {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" style={{ color: '#E8734A' }} />
      ))}
    </div>
  )
}

export default function TestimonialsSection() {
  const t = useTranslations('landing.testimonials')

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="font-heading text-4xl font-bold text-[#1A1A2E] md:text-5xl">
            {t('title')}
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full" style={{ backgroundColor: '#E8734A' }} />
          <p className="mt-5 text-[#1A1A2E]/55">{t('subtitle')}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map(({ key, initials, color }) => (
            <div
              key={key}
              className="rounded-2xl bg-[#FAFAF8] p-7 flex flex-col gap-4"
              style={{ border: '1px solid #E8734A10' }}
            >
              <Stars />
              <p className="flex-1 text-[#1A1A2E]/70 leading-relaxed italic">
                &ldquo;{t(`${key}Quote`)}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#E8734A10]">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A2E]">{t(`${key}Name`)}</p>
                  <p className="text-xs text-[#1A1A2E]/45">{t(`${key}Role`)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Aggregate rating */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <Stars />
          <span className="text-sm font-semibold text-[#1A1A2E]">4.8 / 5</span>
          <span className="text-sm text-[#1A1A2E]/40">{t('ratingLabel')}</span>
        </div>
      </div>
    </section>
  )
}
