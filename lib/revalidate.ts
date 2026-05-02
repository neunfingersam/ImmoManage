import { revalidatePath } from 'next/cache'

const LOCALES = ['de', 'en', 'fr', 'it'] as const

/** Revalidates a dashboard path for all supported locales. */
export function revalidateAllLocales(path: string) {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}${path}`)
  }
}
