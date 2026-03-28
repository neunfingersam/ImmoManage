import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Shield, CreditCard, X } from 'lucide-react'

function DashboardMockup() {
  return (
    <div
      className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
      style={{ boxShadow: '0 30px 80px rgba(232,115,74,0.25), 0 0 0 1px rgba(232,115,74,0.12)' }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 bg-[#1A1A2E] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-3 text-xs text-white/30">immo-manage.ch/dashboard</span>
      </div>
      {/* App layout */}
      <div className="flex bg-[#F7F3EE]" style={{ minHeight: 260 }}>
        {/* Sidebar */}
        <div className="w-14 bg-white flex flex-col items-center gap-3 py-4 border-r border-gray-100">
          {['🏠','👥','📄','🔔','💳'].map((icon, i) => (
            <div key={i} className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${i === 0 ? 'bg-[#E8734A]' : 'hover:bg-gray-50'}`}>
              {icon}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-4 space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Objekte', value: '12', color: '#E8734A' },
              { label: 'Mieter', value: '34', color: '#16a34a' },
              { label: 'Offen', value: '3', color: '#d97706' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
          {/* List items */}
          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Liegenschaften</p>
            </div>
            {[
              { name: 'Bahnhofstr. 4', units: '6 Einheiten', status: 'Vermietet', ok: true },
              { name: 'Seeweg 12', units: '4 Einheiten', status: '1 Leer', ok: false },
              { name: 'Hauptgasse 7', units: '8 Einheiten', status: 'Vermietet', ok: true },
            ].map((row) => (
              <div key={row.name} className="flex items-center justify-between px-3 py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-xs font-medium text-gray-700">{row.name}</p>
                  <p className="text-xs text-gray-400">{row.units}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.ok ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>
          {/* QR Invoice hint */}
          <div className="rounded-xl bg-[#E8734A] p-3 flex items-center gap-2">
            <span className="text-lg">📄</span>
            <div>
              <p className="text-xs font-semibold text-white">3 QR-Rechnungen bereit</p>
              <p className="text-xs text-white/70">April 2026 · CHF 9&apos;450</p>
            </div>
          </div>
        </div>
      </div>
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

          {/* Dashboard Mockup */}
          <div className="hidden justify-center sm:flex md:justify-end">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
