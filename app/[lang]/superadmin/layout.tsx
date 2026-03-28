// app/[lang]/superadmin/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SuperAdminSidebar, SuperAdminMobileNav } from '@/components/layout/SuperAdminSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { prisma } from '@/lib/prisma'

export default async function SuperAdminLayout({
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

  if (session.user.role !== 'SUPER_ADMIN') {
    redirect(`/${locale}/403`)
  }

  const deletionCount = await prisma.accountDeletionRequest.count({
    where: { status: 'PENDING' },
  })

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      <SuperAdminSidebar deletionCount={deletionCount} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          userName={session.user.name}
          userEmail={session.user.email}
          userRole={session.user.role}
          mobileNav={<SuperAdminMobileNav deletionCount={deletionCount} />}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
