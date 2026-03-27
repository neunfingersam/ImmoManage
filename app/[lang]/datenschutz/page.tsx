import { getTranslations, getLocale } from 'next-intl/server'
import Link from 'next/link'

export async function generateMetadata() {
  const t = await getTranslations('datenschutz')
  return { title: t('title') }
}

export default async function DatenschutzPage() {
  const t = await getTranslations('datenschutz')
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
        <h1 className="font-heading text-4xl font-bold text-[#1A1A2E] mb-2">{t('title')}</h1>
        <p className="text-sm text-[#1A1A2E]/40 mb-10">{t('lastUpdated')}</p>

        <div className="prose prose-slate max-w-none space-y-8 text-[#1A1A2E]/80">

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-3">{t('s1Title')}</h2>
            <p>{t('s1Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-3">{t('s2Title')}</h2>
            <p>{t('s2Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-3">{t('s3Title')}</h2>
            <p>{t('s3Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-3">{t('s4Title')}</h2>
            <p>{t('s4Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-3">{t('s5Title')}</h2>
            <p>{t('s5Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-3">{t('s6Title')}</h2>
            <p>{t('s6Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-3">{t('s7Title')}</h2>
            <p>{t('s7Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-3">{t('s8Title')}</h2>
            <p>{t('s8Body')}</p>
          </section>

        </div>
      </div>
    </div>
  )
}
