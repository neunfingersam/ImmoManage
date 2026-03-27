// eslint-disable-next-line @next/next/no-img-element
import { useTranslations } from 'next-intl'

export default function HeroSection() {
  const t = useTranslations('landing.hero')

  return (
    <section className="relative overflow-hidden bg-[#FAFAF8] py-20 md:py-32">
      {/* Background decoration */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #E8734A 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, #E8734A 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Badge */}
        <div className="mb-6 flex justify-center md:justify-start">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
            style={{ borderColor: '#E8734A40', color: '#E8734A', backgroundColor: '#E8734A10' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {t('badge')}
          </span>
        </div>

        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Text */}
          <div>
            <h1 className="mb-6 font-heading text-5xl font-bold leading-[1.1] tracking-tight text-[#1A1A2E] md:text-6xl lg:text-7xl">
              <span className="block">{t('headline')}</span>
              <span className="block" style={{ color: '#E8734A' }}>
                {t('headlineAccent')}
              </span>
            </h1>
            <p className="mb-10 max-w-lg text-lg leading-relaxed text-[#1A1A2E]/60">
              {t('subtext')}
            </p>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl active:translate-y-0"
              style={{ backgroundColor: '#E8734A', boxShadow: '0 8px 30px rgba(232,115,74,0.35)' }}
            >
              {t('cta')}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>

          {/* Visual */}
          <div className="flex justify-center md:justify-end">
            <div
              className="relative flex h-72 w-72 items-center justify-center rounded-3xl md:h-80 md:w-80"
              style={{
                background: 'linear-gradient(135deg, #fff 0%, #F0E6D3 100%)',
                boxShadow: '0 25px 80px rgba(232,115,74,0.2), 0 0 0 1px rgba(232,115,74,0.1)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="ImmoManage"
                className="h-auto w-56 drop-shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
