import { getTranslations, getLocale } from 'next-intl/server'
import Link from 'next/link'

export async function generateMetadata() {
  const t = await getTranslations('impressum')
  return { title: t('title') }
}

export default async function ImpressumPage() {
  const t = await getTranslations('impressum')
  const locale = await getLocale()

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href={`/${locale}`}
          className="mb-10 inline-flex items-center gap-2 text-sm text-[#1A1A2E]/50 hover:text-[#E8734A] transition-colors"
        >
          ← {t('back')}
        </Link>
        <h1 className="font-heading text-4xl font-bold text-[#1A1A2E] mb-10">{t('title')}</h1>

        <div className="space-y-8 text-[#1A1A2E]/80">

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-3">{t('companyTitle')}</h2>
            <p className="whitespace-pre-line">{t('companyBody')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-3">{t('contactTitle')}</h2>
            <p className="whitespace-pre-line">{t('contactBody')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-3">{t('liabilityTitle')}</h2>
            <p>{t('liabilityBody')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-3">{t('hostingTitle')}</h2>
            <p>{t('hostingBody')}</p>
          </section>

        </div>
      </div>
    </div>
  )
}
