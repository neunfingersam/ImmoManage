import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { OwnerSidebar, OwnerMobileNav } from '@/components/layout/OwnerSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'

export default async function OwnerLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang: locale } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/${locale}/auth/login`)
  }

  if (session.user.role !== 'EIGENTUEMER') {
    redirect(`/${locale}/403`)
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      <OwnerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          userName={session.user.name}
          userEmail={session.user.email}
          userRole={session.user.role}
          mobileNav={<OwnerMobileNav />}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
