import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/de/', '/fr/', '/en/', '/it/'],
      disallow: ['/dashboard/', '/tenant/', '/owner/', '/superadmin/', '/api/'],
    },
    sitemap: 'https://immo-manage.ch/sitemap.xml',
  }
}
