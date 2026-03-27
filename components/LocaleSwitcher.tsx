'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { routing, type Locale } from '@/i18n/routing'

const localeLabels: Record<Locale, string> = {
  de: 'DE',
  fr: 'FR',
  en: 'EN',
  it: 'IT',
}

export function LocaleSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(newLocale: Locale) {
    if (newLocale === locale) return
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  return (
    <>
      {/* Desktop: pill buttons */}
      <div className="hidden items-center gap-1 sm:flex">
        {routing.locales.map((loc) => (
          <button
            key={loc}
            onClick={() => switchLocale(loc as Locale)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              loc === locale
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {localeLabels[loc as Locale]}
          </button>
        ))}
      </div>

      {/* Mobile: native select */}
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value as Locale)}
        className="block sm:hidden rounded-lg border border-[#E8734A]/20 bg-white px-2 py-1.5 text-xs font-medium text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#E8734A]/30"
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeLabels[loc as Locale]}
          </option>
        ))}
      </select>
    </>
  )
}
