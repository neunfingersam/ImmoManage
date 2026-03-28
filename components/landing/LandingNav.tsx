'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function LandingNav() {
  const t = useTranslations('landing.nav')
  const locale = useLocale()
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#E8734A]/10 bg-[#FAFAF8]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ImmoManage" className="h-10 w-auto" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 sm:flex">
          <LocaleSwitcher />
          <Link
            href={`/${locale}/preise`}
            className="text-sm font-medium text-[#1A1A2E]/60 hover:text-[#1A1A2E] transition-colors"
          >
            {t('pricing')}
          </Link>
          <Link
            href={`/${locale}/auth/login`}
            className="text-sm font-medium text-[#1A1A2E]/60 hover:text-[#1A1A2E] transition-colors"
          >
            {t('login')}
          </Link>
          <Link
            href={`/${locale}/preise`}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-px hover:shadow-lg active:translate-y-0"
            style={{ backgroundColor: '#E8734A' }}
          >
            {t('bookDemo')}
          </Link>
        </div>

        {/* Mobile: locale + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <LocaleSwitcher />
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-[#1A1A2E]/60 hover:bg-[#E8734A]/10 transition-colors"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-[#E8734A]/10 bg-[#FAFAF8] px-6 pb-4 sm:hidden">
          <div className="flex flex-col gap-3 pt-3">
            <Link
              href={`/${locale}/preise`}
              onClick={() => setOpen(false)}
              className="rounded-xl border border-[#E8734A]/20 px-4 py-3 text-center text-sm font-medium text-[#1A1A2E] hover:bg-[#E8734A]/5 transition-colors"
            >
              {t('pricing')}
            </Link>
            <Link
              href={`/${locale}/auth/login`}
              onClick={() => setOpen(false)}
              className="rounded-xl border border-[#E8734A]/20 px-4 py-3 text-center text-sm font-medium text-[#1A1A2E] hover:bg-[#E8734A]/5 transition-colors"
            >
              {t('login')}
            </Link>
            <Link
              href={`/${locale}/preise`}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-white"
              style={{ backgroundColor: '#E8734A' }}
            >
              {t('bookDemo')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
