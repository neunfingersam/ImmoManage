// app/[lang]/superadmin/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { SuperAdminSidebar, SuperAdminMobileNav } from '@/components/layout/SuperAdminSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const locale = await getLocale()

  if (!session) {
    redirect(`/${locale}/auth/login`)
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    redirect(`/${locale}/403`)
  }

  return (
    <div className="flex h-screen bg-background">
      <SuperAdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          userName={session.user.name}
          userEmail={session.user.email}
          userRole={session.user.role}
          mobileNav={<SuperAdminMobileNav />}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
