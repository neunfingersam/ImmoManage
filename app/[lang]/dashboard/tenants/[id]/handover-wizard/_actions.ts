'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type WizardState = {
  step1?: { terminationDate: string; confirmed: boolean }
  step2?: { successorStatus: string; notes: string; plannedMoveIn?: string }
  step3?: { handoverId: string; handoverDate: string }
  step4?: { deductions: Array<{ reason: string; amount: number }>; refundAmount: number }
  step5?: { completed: boolean }
  currentStep: number
}

export async function updateWizardStepAction(leaseId: string, step: number, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  const lease = await prisma.lease.findFirst({
    where: { id: leaseId, companyId: session.user.companyId },
    select: { handoverWizard: true },
  })

  if (!lease) throw new Error('Lease not found')

  const wizard = (lease.handoverWizard as WizardState | null) ?? { currentStep: 1 }
  const stepKey = `step${step}` as keyof WizardState

  const updated: WizardState = {
    ...wizard,
    [stepKey]: data,
    currentStep: Math.max(wizard.currentStep, step + 1),
  }

  await prisma.lease.update({
    where: { id: leaseId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { handoverWizard: updated as any },
  })

  await prisma.activityLog.create({
    data: {
      companyId: session.user.companyId,
      userId: session.user.id,
      action: `HANDOVER_WIZARD_STEP_${step}`,
      entity: 'Lease',
      entityId: leaseId,
      meta: { step },
    },
  })

  revalidatePath('/dashboard/tenants')
  return { nextStep: step + 1 }
}
