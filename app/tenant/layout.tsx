// app/tenant/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TenantSidebar } from '@/components/layout/TenantSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'MIETER') {
    redirect('/403')
  }

  return (
    <div className="flex h-screen bg-background">
      <TenantSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          userName={session.user.name}
          userEmail={session.user.email}
          userRole={session.user.role}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
