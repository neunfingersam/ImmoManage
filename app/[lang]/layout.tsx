// app/[lang]/layout.tsx
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'

type Props = {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ lang: locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { lang } = await params
  if (!routing.locales.includes(lang as Locale)) {
    notFound()
  }
  const locale = lang as Locale
  setRequestLocale(locale)
  const messages = (await import(`../../messages/${locale}.json`)).default
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
