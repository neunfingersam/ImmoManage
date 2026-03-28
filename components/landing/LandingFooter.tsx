'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'

export default function LandingFooter() {
  const t = useTranslations('landing.footer')
  const locale = useLocale()

  return (
    <footer className="border-t bg-[#1A1A2E]" style={{ borderColor: '#ffffff10' }}>
      <div className="mx-auto max-w-6xl px-6 py-14">
        {/* Main grid */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ImmoManage" className="h-9 w-auto mb-4 brightness-0 invert" />
            <p className="text-sm text-white/40 leading-relaxed max-w-[180px]">
              {t('tagline')}
            </p>
          </div>

          {/* Produkt */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">{t('colProduct')}</p>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/preise`} className="text-sm text-white/55 hover:text-white transition-colors">{t('linkPricing')}</Link></li>
              <li><Link href={`/${locale}/preise#faq`} className="text-sm text-white/55 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href={`/${locale}/auth/login`} className="text-sm text-white/55 hover:text-white transition-colors">{t('linkLogin')}</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">{t('colFeatures')}</p>
            <ul className="space-y-2.5">
              {(['linkQr', 'linkTenant', 'linkAi', 'linkDocs'] as const).map((key) => (
                <li key={key}><span className="text-sm text-white/55">{t(key)}</span></li>
              ))}
            </ul>
          </div>

          {/* Rechtliches */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">{t('colLegal')}</p>
            <ul className="space-y-2.5">
              <li><Link href={`/${locale}/datenschutz`} className="text-sm text-white/55 hover:text-white transition-colors">{t('privacy')}</Link></li>
              <li><Link href={`/${locale}/impressum`} className="text-sm text-white/55 hover:text-white transition-colors">{t('imprint')}</Link></li>
              <li><a href="mailto:flaviopeter@immo-manage.ch" className="text-sm text-white/55 hover:text-white transition-colors">Kontakt</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-4 border-t pt-8 sm:flex-row sm:justify-between" style={{ borderColor: '#ffffff10' }}>
          <p className="text-sm text-white/25">{t('copyright')}</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-white/30">
              <span>🇨🇭</span> {t('madeIn')}
            </span>
            <LocaleSwitcher />
          </div>
        </div>
      </div>
    </footer>
  )
}
