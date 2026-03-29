import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LandingNav from '@/components/landing/LandingNav'
import HeroSection from '@/components/landing/HeroSection'
import ProblemSection from '@/components/landing/ProblemSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import ForWhomSection from '@/components/landing/ForWhomSection'
import DemoCtaSection from '@/components/landing/DemoCtaSection'
import LandingFooter from '@/components/landing/LandingFooter'

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await getServerSession(authOptions)

  if (session) {
    switch (session.user.role) {
      case 'SUPER_ADMIN':
        redirect(`/${lang}/superadmin`)
      case 'ADMIN':
      case 'VERMIETER':
        redirect(`/${lang}/dashboard`)
      case 'MIETER':
        redirect(`/${lang}/tenant`)
      case 'EIGENTUEMER':
        redirect(`/${lang}/owner`)
      default:
        redirect(`/${lang}/auth/login`)
    }
  }

  return (
    <main>
      <LandingNav />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <ForWhomSection />
      <TestimonialsSection />
      <DemoCtaSection />
      <LandingFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'ImmoManage',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            url: 'https://immo-manage.ch',
            description: 'Die Schweizer Software für Hausverwaltungen und private Vermieter. Mietverträge, QR-Rechnungen, Mieterportal, Schadensmeldungen.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'CHF' },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              reviewCount: '24',
            },
            publisher: {
              '@type': 'Organization',
              name: 'ImmoManage',
              url: 'https://immo-manage.ch',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Küntwilerstrasse 23',
                postalCode: '6343',
                addressLocality: 'Rotkreuz',
                addressCountry: 'CH',
              },
            },
          }),
        }}
      />
    </main>
  )
}
