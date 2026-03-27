import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

export default function ForWhomSection() {
  const t = useTranslations('landing.forWhom')
  const seg1 = t.raw('segment1Points') as string[]
  const seg2 = t.raw('segment2Points') as string[]

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="font-heading text-4xl font-bold text-[#1A1A2E] md:text-5xl">
            {t('title')}
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full" style={{ backgroundColor: '#E8734A' }} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Segment 1 — highlighted */}
          <div
            className="rounded-3xl p-10"
            style={{
              background: 'linear-gradient(135deg, #E8734A 0%, #d4603a 100%)',
              boxShadow: '0 20px 60px rgba(232,115,74,0.3)',
            }}
          >
            <div className="mb-1 text-2xl font-bold text-white">{t('segment1Title')}</div>
            <div className="mb-8 text-sm font-medium text-white/70">{t('segment1Subtitle')}</div>
            <ul className="space-y-4">
              {seg1.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-white/90">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Segment 2 */}
          <div
            className="rounded-3xl p-10"
            style={{ backgroundColor: '#F7F3EE', border: '1px solid #E8734A15' }}
          >
            <div className="mb-1 text-2xl font-bold text-[#1A1A2E]">{t('segment2Title')}</div>
            <div className="mb-8 text-sm font-medium" style={{ color: '#E8734A' }}>{t('segment2Subtitle')}</div>
            <ul className="space-y-4">
              {seg2.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: '#E8734A20' }}
                  >
                    <Check className="h-3 w-3" style={{ color: '#E8734A' }} strokeWidth={3} />
                  </div>
                  <span className="text-[#1A1A2E]/75">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
