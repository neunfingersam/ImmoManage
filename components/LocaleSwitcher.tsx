// components/LocaleSwitcher.tsx
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
    // Replace the locale segment in the current path
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  return (
    <div className="flex items-center gap-1">
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
  )
}
