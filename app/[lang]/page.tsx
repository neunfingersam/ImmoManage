import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LandingPage from '@/app/landing/page'

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

  return <LandingPage />
}
