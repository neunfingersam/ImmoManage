import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getPlanLimits } from '@/lib/plan-limits'
import { UpgradeGate } from '@/components/shared/UpgradeGate'
import AssistantClient from './AssistantClient'

export default async function DashboardAssistantPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    const { lang } = await params
    redirect(`/${lang}/auth/login`)
  }

  const company = await prisma.company.findUnique({ where: { id: session.user.companyId } })
  const limits = getPlanLimits(company?.plan ?? 'STARTER')

  if (!limits.features.aiAssistant) {
    return <UpgradeGate feature="KI-Assistent" requiredPlan="Pro" />
  }

  return <AssistantClient />
}
