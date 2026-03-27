import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'

export default function LandingNav() {
  const t = useTranslations('landing.nav')

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#E8734A]/10 bg-[#FAFAF8]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ImmoManage" className="h-11 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <Link
            href="/de/auth/login"
            className="hidden text-sm font-medium text-[#1A1A2E]/60 hover:text-[#1A1A2E] transition-colors sm:block"
          >
            {t('login')}
          </Link>
          <a
            href="#demo"
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-px hover:shadow-lg active:translate-y-0"
            style={{ backgroundColor: '#E8734A' }}
          >
            {t('bookDemo')}
          </a>
        </div>
      </div>
    </nav>
  )
}
