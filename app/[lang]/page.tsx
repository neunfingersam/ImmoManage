import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LandingNav from '@/components/landing/LandingNav'
import HeroSection from '@/components/landing/HeroSection'
import ProblemSection from '@/components/landing/ProblemSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
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
      <DemoCtaSection />
      <LandingFooter />
    </main>
  )
}
