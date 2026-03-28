// app/[lang]/dashboard/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardSidebar, DashboardMobileNav } from '@/components/layout/DashboardSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { getPlanLimits } from '@/lib/plan-limits'

export default async function DashboardLayout({
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

  if (session.user.role === 'MIETER') {
    redirect(`/${locale}/403`)
  }

  let companyName: string | undefined
  let planFeatures = { qrInvoice: true, taxFolder: true, aiAssistant: true }
  if (session.user.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { name: true, plan: true },
    })
    companyName = company?.name ?? undefined
    if (company?.plan) {
      planFeatures = getPlanLimits(company.plan).features
    }
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      <DashboardSidebar role={session.user.role} companyName={companyName} planFeatures={planFeatures} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          userName={session.user.name}
          userEmail={session.user.email}
          userRole={session.user.role}
          mobileNav={<DashboardMobileNav role={session.user.role} companyName={companyName} planFeatures={planFeatures} />}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
