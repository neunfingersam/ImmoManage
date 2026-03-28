import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ManageSubscriptionButton } from '@/components/billing/ManageSubscriptionButton'
import { CreditCard, CheckCircle2, Clock, AlertTriangle, XCircle, Ban } from 'lucide-react'

const planLabels: Record<string, string> = {
  STARTER: 'Starter',
  STANDARD: 'Standard',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
}

const planPrices: Record<string, string> = {
  STARTER: 'CHF 19/Monat',
  STANDARD: 'CHF 39/Monat',
  PRO: 'CHF 79/Monat',
  ENTERPRISE: 'Auf Anfrage',
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    TRIAL: { label: 'Testphase', icon: Clock, color: '#E8734A', bg: '#E8734A15' },
    ACTIVE: { label: 'Aktiv', icon: CheckCircle2, color: '#16a34a', bg: '#16a34a15' },
    PAST_DUE: { label: 'Zahlung überfällig', icon: AlertTriangle, color: '#dc2626', bg: '#dc262615' },
    PENDING_PAYMENT: { label: 'Zahlung ausstehend', icon: AlertTriangle, color: '#d97706', bg: '#d9770615' },
    CANCELLED: { label: 'Gekündigt', icon: Ban, color: '#6b7280', bg: '#6b728015' },
  }
  const c = config[status] ?? { label: status, icon: XCircle, color: '#6b7280', bg: '#6b728015' }
  const Icon = c.icon
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  )
}

function daysLeft(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000))
}

export default async function AboPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: locale } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect(`/${locale}/dashboard`)

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId! },
    select: {
      name: true,
      plan: true,
      planStatus: true,
      trialEndsAt: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
    },
  })
  if (!company) redirect(`/${locale}/dashboard`)

  const hasStripe = !!company.stripeCustomerId
  const trialDays = company.trialEndsAt ? daysLeft(company.trialEndsAt) : null
  const isTrial = company.planStatus === 'TRIAL'
  const isActive = company.planStatus === 'ACTIVE'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Abo & Plan</h1>
        <p className="text-sm text-muted-foreground mt-1">Verwalte deinen Abonnementplan und die Zahlungsmethode.</p>
      </div>

      {/* Plan card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2.5" style={{ backgroundColor: '#E8734A15' }}>
              <CreditCard className="h-5 w-5" style={{ color: '#E8734A' }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Aktueller Plan</p>
              <p className="text-xl font-bold text-foreground">
                {planLabels[company.plan] ?? company.plan}
              </p>
            </div>
          </div>
          <StatusBadge status={company.planStatus} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Preis</p>
            <p className="font-semibold text-foreground">{planPrices[company.plan] ?? '—'}</p>
          </div>
          {isTrial && company.trialEndsAt && (
            <div>
              <p className="text-muted-foreground">Testphase endet</p>
              <p className="font-semibold text-foreground">
                {company.trialEndsAt.toLocaleDateString('de-CH')}
                {' '}
                <span className="text-xs font-normal text-muted-foreground">
                  ({trialDays === 0 ? 'heute' : `noch ${trialDays} ${trialDays === 1 ? 'Tag' : 'Tage'}`})
                </span>
              </p>
            </div>
          )}
          {isActive && company.stripeSubscriptionId && (
            <div>
              <p className="text-muted-foreground">Abrechnung</p>
              <p className="font-semibold text-foreground">Monatlich via Stripe</p>
            </div>
          )}
        </div>

        {isTrial && trialDays !== null && trialDays <= 14 && (
          <div
            className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ backgroundColor: '#E8734A15', color: '#E8734A' }}
          >
            Deine Testphase endet in {trialDays === 0 ? 'weniger als 24 Stunden' : `${trialDays} ${trialDays === 1 ? 'Tag' : 'Tagen'}`}.
            {' '}Verwalte dein Abo um eine Unterbrechung zu vermeiden.
          </div>
        )}

        {company.planStatus === 'PAST_DUE' && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium bg-red-50 text-red-600">
            Deine letzte Zahlung ist fehlgeschlagen. Bitte aktualisiere deine Zahlungsmethode um eine Sperrung zu vermeiden.
          </div>
        )}

        {company.planStatus === 'CANCELLED' && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium bg-gray-100 text-gray-600">
            Dein Abo wurde gekündigt. Du kannst jederzeit einen neuen Plan buchen.
          </div>
        )}

        {hasStripe ? (
          <div className="pt-1 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">
              Im Stripe-Kundenportal kannst du deinen Plan ändern, die Zahlungsmethode aktualisieren oder das Abo kündigen.
            </p>
            <ManageSubscriptionButton />
          </div>
        ) : (
          <div className="pt-1 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Kein Stripe-Konto verknüpft. Bei Fragen kontaktiere uns unter{' '}
              <a href="mailto:flaviopeter@immo-manage.ch" className="underline hover:text-foreground">
                flaviopeter@immo-manage.ch
              </a>.
            </p>
          </div>
        )}
      </div>

      {/* Deletion notice */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground mb-1">Account löschen</h2>
        <p className="text-sm text-muted-foreground">
          {company.stripeSubscriptionId && (company.planStatus === 'ACTIVE' || company.planStatus === 'TRIAL')
            ? 'Du hast ein aktives Abonnement. Bitte kündige zuerst dein Abo über das Stripe-Kundenportal, bevor du deinen Account löschen kannst.'
            : 'Um deinen Account zu löschen, wende dich an den Support unter flaviopeter@immo-manage.ch.'}
        </p>
        {company.stripeSubscriptionId && (company.planStatus === 'ACTIVE' || company.planStatus === 'TRIAL') && (
          <div className="mt-3">
            <ManageSubscriptionButton />
          </div>
        )}
      </div>
    </div>
  )
}
