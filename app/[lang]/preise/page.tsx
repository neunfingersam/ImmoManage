import LandingNav from '@/components/landing/LandingNav'
import LandingFooter from '@/components/landing/LandingFooter'
import PricingCards from './PricingCards'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pricing')
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
  }
}

const competitors = [
  { name: 'Fairwalter', price: '49–199', note: 'CH' },
  { name: 'Rimo R5', price: '59–299', note: 'CH' },
  { name: 'Garaio REM', price: '200+', note: 'Enterprise' },
  { name: 'ImmoManage', price: '0–79', note: null, highlight: true },
]

export default async function PreisePage() {
  const t = await getTranslations('pricing')

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <LandingNav />

      {/* Hero */}
      <section className="py-16 md:py-24 text-center px-6">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-6"
          style={{ borderColor: '#E8734A40', color: '#E8734A', backgroundColor: '#E8734A10' }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {t('heroBadge')}
        </span>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1A1A2E] mb-4">
          {t('heroTitle')}
        </h1>
        <p className="text-lg text-[#1A1A2E]/60 max-w-xl mx-auto mb-2">
          {t('heroSubtitle')}
        </p>
        <p className="text-sm text-[#1A1A2E]/40">
          {t('heroComparison')}
        </p>
      </section>

      {/* Pricing cards (interactive) */}
      <section className="pb-16 px-6">
        <div className="mx-auto max-w-6xl">
          <PricingCards />
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-[#1A1A2E] text-center mb-2">{t('compareTitle')}</h2>
          <p className="text-sm text-center text-[#1A1A2E]/50 mb-8">
            {t('compareSubtitle')}
          </p>
          <div className="overflow-hidden rounded-2xl border border-[#E8734A20]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8734A10] bg-[#E8734A05]">
                  <th className="text-left px-5 py-3 font-semibold text-[#1A1A2E]/60">{t('compareProvider')}</th>
                  <th className="text-right px-5 py-3 font-semibold text-[#1A1A2E]/60">{t('comparePrice')}</th>
                  <th className="text-right px-5 py-3 font-semibold text-[#1A1A2E]/60">{t('compareNote')}</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <tr
                    key={c.name}
                    className="border-b last:border-0"
                    style={{
                      borderColor: '#E8734A10',
                      backgroundColor: c.highlight ? '#E8734A08' : i % 2 === 0 ? '#fff' : '#FAFAF8',
                    }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: c.highlight ? '#E8734A' : '#1A1A2E' }}>
                      {c.name}
                      {c.highlight && (
                        <span className="ml-2 text-xs bg-[#E8734A20] text-[#E8734A] rounded-full px-2 py-0.5">{t('compareYou')}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono" style={{ color: c.highlight ? '#E8734A' : undefined }}>
                      CHF {c.price}
                    </td>
                    <td className="px-5 py-3 text-right text-[#1A1A2E]/40">{c.note ?? '← ' + t('compareYou')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#1A1A2E]/30 text-center mt-3">
            {t('compareDisclaimer')}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 px-6 border-t border-[#E8734A10]">
        <div className="mx-auto max-w-2xl pt-16">
          <h2 className="text-2xl font-bold text-[#1A1A2E] text-center mb-10">{t('faqTitle')}</h2>
          <div className="space-y-6">
            {(
              [
                ['faq1q', 'faq1a'],
                ['faq2q', 'faq2a'],
                ['faq3q', 'faq3a'],
                ['faq4q', 'faq4a'],
                ['faq5q', 'faq5a'],
              ] as const
            ).map(([qKey, aKey]) => (
              <div key={qKey} className="border-b border-[#E8734A10] pb-6 last:border-0">
                <p className="font-semibold text-[#1A1A2E] mb-2">{t(qKey)}</p>
                <p className="text-sm text-[#1A1A2E]/60 leading-relaxed">{t(aKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'ImmoManage',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: [
              { '@type': 'Offer', name: 'Starter', price: '19', priceCurrency: 'CHF' },
              { '@type': 'Offer', name: 'Standard', price: '39', priceCurrency: 'CHF' },
              { '@type': 'Offer', name: 'Pro', price: '79', priceCurrency: 'CHF' },
            ],
          }),
        }}
      />
    </main>
  )
}
