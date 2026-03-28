import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Shield, CreditCard, X } from 'lucide-react'

function DashboardPreview() {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        boxShadow: '0 30px 80px rgba(232,115,74,0.2), 0 0 0 1px rgba(232,115,74,0.12)',
      }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 bg-[#1A1A2E] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28CA41]" />
        <span className="ml-3 flex-1 rounded bg-white/10 px-3 py-0.5 text-xs text-white/40 font-mono">
          immo-manage.ch/dashboard
        </span>
      </div>
      {/* Screenshot */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/dashboard-preview.png"
        alt="ImmoManage Dashboard"
        className="w-full block"
        style={{ display: 'block' }}
      />
    </div>
  )
}

export default function HeroSection() {
  const t = useTranslations('landing.hero')
  const locale = useLocale()

  return (
    <section className="relative overflow-hidden bg-[#FAFAF8] py-16 md:py-32">
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

        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          {/* Text */}
          <div className="text-center md:text-left">
            <h1 className="mb-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-[#1A1A2E] sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block">{t('headline')}</span>
              <span className="block" style={{ color: '#E8734A' }}>
                {t('headlineAccent')}
              </span>
            </h1>
            <p className="mb-8 text-base leading-relaxed text-[#1A1A2E]/60 sm:text-lg md:mb-10 md:max-w-lg">
              {t('subtext')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link
                href={`/${locale}/preise`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl active:translate-y-0"
                style={{ backgroundColor: '#E8734A', boxShadow: '0 8px 30px rgba(232,115,74,0.35)' }}
              >
                {t('cta')}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            {/* Trust bar */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-start">
              {[
                { icon: <X className="h-3 w-3" />, text: t('trustNoCreditCard') },
                { icon: <Shield className="h-3 w-3" />, text: t('trustSwissServer') },
                { icon: <CreditCard className="h-3 w-3" />, text: t('trustCancelAnytime') },
              ].map((item) => (
                <span key={item.text} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1A1A2E]/50">
                  <span style={{ color: '#E8734A' }}>{item.icon}</span>
                  {item.text}
                </span>
              ))}
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="hidden justify-center sm:flex md:justify-end">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  )
}
