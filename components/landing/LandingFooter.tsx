import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'

export default function LandingFooter() {
  const t = useTranslations('landing.footer')
  const locale = useLocale()

  return (
    <footer className="border-t bg-white py-10" style={{ borderColor: '#E8734A15' }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 md:flex-row md:justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ImmoManage" className="h-9 w-auto" />
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#1A1A2E]/45">
          <Link href={`/${locale}/datenschutz`} className="transition-colors hover:text-[#E8734A]">{t('privacy')}</Link>
          <Link href={`/${locale}/impressum`} className="transition-colors hover:text-[#E8734A]">{t('imprint')}</Link>
          <LocaleSwitcher />
        </div>
        <p className="text-sm text-[#1A1A2E]/35">{t('copyright')}</p>
      </div>
    </footer>
  )
}
