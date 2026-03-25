// app/[lang]/dashboard/tenants/[id]/handover-wizard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WizardStep } from '@/components/handover-wizard/WizardStep'
import { notFound } from 'next/navigation'
import { updateWizardStepAction } from './_actions'

export default async function HandoverWizardPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const { id } = await params

  const tenant = await prisma.user.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      leases: {
        where: { status: 'ACTIVE' },
        include: {
          unit: { include: { property: true } },
        },
        take: 1,
      },
    },
  })

  if (!tenant || tenant.leases.length === 0) notFound()

  const lease = tenant.leases[0]
  const wizard = lease.handoverWizard as { currentStep?: number } | null
  const currentStep = wizard?.currentStep ?? 1

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Mieterwechsel-Assistent</h1>
        <p className="text-muted-foreground text-sm">
          {tenant.name} — {lease.unit.property.name}, Einheit {lease.unit.unitNumber}
        </p>
      </div>

      <div className="space-y-3">
        <WizardStep step={1} currentStep={currentStep} title="Kündigung erfassen">
          <form
            action={async (fd: FormData) => {
              'use server'
              await updateWizardStepAction(lease.id, 1, {
                terminationDate: fd.get('terminationDate') as string,
                confirmed: fd.get('confirmed') === 'on',
              })
            }}
          >
            <div className="space-y-2 mb-3">
              <input
                type="date"
                name="terminationDate"
                className="border border-border rounded-lg px-3 py-2 w-full text-sm bg-background"
                required
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="confirmed" />
                <span>Kündigung schriftlich erhalten</span>
              </label>
            </div>
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
              Weiter →
            </button>
          </form>
        </WizardStep>

        <WizardStep step={2} currentStep={currentStep} title="Nachmieter">
          <form
            action={async (fd: FormData) => {
              'use server'
              await updateWizardStepAction(lease.id, 2, {
                successorStatus: fd.get('successorStatus') as string,
                notes: fd.get('notes') as string,
              })
            }}
          >
            <div className="space-y-2 mb-3">
              <select
                name="successorStatus"
                className="border border-border rounded-lg px-3 py-2 w-full text-sm bg-background"
              >
                <option value="searching">Wird gesucht</option>
                <option value="found">Gefunden</option>
                <option value="not_needed">Nicht erforderlich</option>
              </select>
              <textarea
                name="notes"
                placeholder="Notizen (Interessenten, Besichtigungen...)"
                className="border border-border rounded-lg px-3 py-2 w-full text-sm bg-background"
                rows={3}
              />
            </div>
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
              Weiter →
            </button>
          </form>
        </WizardStep>

        <WizardStep step={3} currentStep={currentStep} title="Wohnungsübergabe planen">
          <p className="text-sm text-muted-foreground mb-2">
            Übergabeprotokoll wird im Handover-Modul erstellt.
          </p>
          <a href="/dashboard/handovers/new" className="text-primary text-sm underline underline-offset-2">
            → Neues Übergabeprotokoll erstellen
          </a>
          <form
            action={async () => {
              'use server'
              await updateWizardStepAction(lease.id, 3, { confirmed: true })
            }}
            className="mt-3"
          >
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
              Weiter →
            </button>
          </form>
        </WizardStep>

        <WizardStep step={4} currentStep={currentStep} title="Kaution abrechnen">
          <div className="space-y-2 mb-3 text-sm">
            <p className="font-medium">Hinterlegte Kaution: CHF {lease.depositAmount?.toFixed(2) ?? '–'}</p>
            <p className="text-muted-foreground">Mieter-IBAN: {tenant.iban ?? '–'}</p>
            <textarea
              name="deductions"
              placeholder="Abzüge (z.B. Reinigung CHF 200, Schaden CHF 150)"
              className="border border-border rounded-lg px-3 py-2 w-full bg-background"
              rows={2}
              readOnly
            />
          </div>
          <form
            action={async (fd: FormData) => {
              'use server'
              await updateWizardStepAction(lease.id, 4, {
                deductions: [],
                refundAmount: lease.depositAmount ?? 0,
              })
            }}
          >
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
              Weiter →
            </button>
          </form>
        </WizardStep>

        <WizardStep step={5} currentStep={currentStep} title="Neuen Mieter anlegen">
          <p className="text-sm text-muted-foreground mb-2">
            Das Mietverhältnis wird beendet, ein neuer Mieter kann angelegt werden.
          </p>
          <a
            href={`/dashboard/tenants/new?propertyId=${lease.unit.propertyId}&unitId=${lease.unitId}`}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium inline-block"
          >
            Neuen Mieter anlegen
          </a>
        </WizardStep>
      </div>
    </div>
  )
}
