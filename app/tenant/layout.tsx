// app/tenant/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TenantSidebar, TenantMobileNav } from '@/components/layout/TenantSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { prisma } from '@/lib/prisma'

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

  // Query upcoming events count for this tenant
  let upcomingEventsCount = 0
  try {
    const now = new Date()
    const leases = await prisma.lease.findMany({
      where: {
        tenantId: session.user.id,
        status: 'ACTIVE',
      },
      include: { unit: { select: { id: true, propertyId: true } } },
    })
    const unitIds = leases.map((l) => l.unit.id)
    const propertyIds = leases.map((l) => l.unit.propertyId)

    upcomingEventsCount = await (prisma.calendarEvent as any).count({
      where: {
        companyId: session.user.companyId,
        date: { gte: now },
        OR: [
          { unitId: { in: unitIds } },
          { propertyId: { in: propertyIds }, unitId: null },
        ],
      },
    })
  } catch {
    // Silently ignore — badge is non-critical
  }

  return (
    <div className="flex h-screen bg-background">
      <TenantSidebar upcomingEventsCount={upcomingEventsCount} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          userName={session.user.name}
          userEmail={session.user.email}
          userRole={session.user.role}
          mobileNav={<TenantMobileNav upcomingEventsCount={upcomingEventsCount} />}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
