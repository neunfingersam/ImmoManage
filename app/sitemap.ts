import type { MetadataRoute } from 'next'

const base = 'https://immo-manage.ch'
const locales = ['de', 'fr', 'en', 'it']

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/preise', '/datenschutz', '/impressum']

  return locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: `${base}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'weekly' : route === '/preise' ? 'monthly' : 'monthly',
      priority: route === '' ? 1 : route === '/preise' ? 0.9 : 0.5,
    }))
  ) as MetadataRoute.Sitemap
}
