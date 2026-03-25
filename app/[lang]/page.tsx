import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/${lang}/auth/login`)
  }

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
