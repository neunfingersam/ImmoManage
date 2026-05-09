// app/[lang]/dashboard/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardSidebar, DashboardMobileNav } from '@/components/layout/DashboardSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { TrialBanner } from '@/components/layout/TrialBanner'
import { PaymentRequiredWall } from '@/components/layout/PaymentRequiredWall'
import { getPlanLimits } from '@/lib/plan-limits'
import { PushBanner } from '@/components/layout/PushBanner'
import { FeedbackWidget } from '@/components/shared/FeedbackWidget'

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

  if (!['ADMIN', 'VERMIETER'].includes(session.user.role)) {
    redirect(`/${locale}/403`)
  }

  let companyName: string | undefined
  let planFeatures = { qrInvoice: true, taxFolder: true, aiAssistant: true }
  let trialEndsAt: string | null = null
  let planStatus = 'ACTIVE'
  if (session.user.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { name: true, plan: true, planStatus: true, trialEndsAt: true },
    })
    companyName = company?.name ?? undefined
    if (company?.plan) {
      planFeatures = getPlanLimits(company.plan).features
    }
    planStatus = company?.planStatus ?? 'ACTIVE'
    trialEndsAt = company?.trialEndsAt?.toISOString() ?? null
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      <DashboardSidebar role={session.user.role} companyName={companyName} planFeatures={planFeatures} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          userName={session.user.name}
          userEmail={session.user.email}
          userRole={session.user.role}
          profilePath="/dashboard/profile"
          mobileNav={<DashboardMobileNav role={session.user.role} companyName={companyName} planFeatures={planFeatures} />}
        />
        <TrialBanner trialEndsAt={trialEndsAt} planStatus={planStatus} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {planStatus === 'PENDING_PAYMENT' && <PaymentRequiredWall />}
          {children}
        </main>
      </div>
      <PushBanner />
      <FeedbackWidget />
    </div>
  )
}
