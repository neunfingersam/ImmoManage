// app/page.tsx — redirects to locale-prefixed routes
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

// Detect best locale from Accept-Language header (server-side only approach:
// just use the default locale here — next-intl proxy handles real negotiation)
const DEFAULT = routing.defaultLocale

export default async function RootPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/${DEFAULT}`)
  }

  switch (session.user.role) {
    case 'SUPER_ADMIN':
      redirect(`/${DEFAULT}/superadmin`)
    case 'ADMIN':
    case 'VERMIETER':
      redirect(`/${DEFAULT}/dashboard`)
    case 'MIETER':
      redirect(`/${DEFAULT}/tenant`)
    default:
      redirect(`/${DEFAULT}/auth/login`)
  }
}
