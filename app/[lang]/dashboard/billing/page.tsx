import { Receipt, FileDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { BillForm } from '@/components/billing/BillForm'
import { ManageSubscriptionButton } from '@/components/billing/ManageSubscriptionButton'
import { PaymentSettingsForm } from '@/components/billing/PaymentSettingsForm'
import { getBills, getLeasesForBilling, getPaymentSettings } from './_actions'

export default async function BillingPage() {
  const [bills, leases, paymentSettings] = await Promise.all([
    getBills(),
    getLeasesForBilling(),
    getPaymentSettings(),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Nebenkostenabrechnung</h1>
          <p className="text-sm text-muted-foreground mt-1">{bills.length} Abrechnungen</p>
        </div>
        <ManageSubscriptionButton />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Zahlungsangaben (QR-Rechnung)</h2>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground mb-4">
            Diese IBAN und Adresse erscheinen im Zahlungsschein der Nebenkostenabrechnung (Swiss QR Bill).
          </p>
          <PaymentSettingsForm initial={paymentSettings ?? { bankIban: '', bankName: '', street: '', zip: '', city: '' }} />
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Neue Abrechnung</h2>
        <BillForm leases={leases as any} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Alle Abrechnungen</h2>
        {bills.length === 0 ? (
          <EmptyState icon={<Receipt className="h-7 w-7" />} titel="Keine Abrechnungen" beschreibung="Noch keine Nebenkostenabrechnung erstellt." />
        ) : (
          <div className="space-y-2">
            {bills.map(b => (
              <Card key={b.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{b.lease.tenant.name} · {b.property.name} {b.lease.unit.unitNumber}</p>
                  <p className="text-xs text-muted-foreground">Jahr {b.year}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right shrink-0">
                    <p className="font-serif text-foreground">CHF {b.amount.toFixed(2)}</p>
                    {b.sentAt && <p className="text-xs text-muted-foreground">Gesendet {new Date(b.sentAt).toLocaleDateString('de-DE')}</p>}
                  </div>
                  <a
                    href={`/api/export/bill/${b.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title="PDF anzeigen"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                  >
                    <FileDown className="h-4 w-4" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
