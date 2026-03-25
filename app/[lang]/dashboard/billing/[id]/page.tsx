// app/[lang]/dashboard/billing/[id]/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { TenantShare, CostItem } from '@/lib/utility-billing'

export default async function BillingDetailPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const { id } = await params

  const bill = await prisma.utilityBill.findUnique({
    where: { id },
    include: {
      property: { select: { name: true } },
      lease: { include: { tenant: { select: { name: true } } } },
    },
  })

  if (!bill || bill.companyId !== session.user.companyId) notFound()

  const costItems = bill.costItems ? (JSON.parse(bill.costItems as string) as CostItem[]) : []
  const tenantShares = bill.tenantShares ? (JSON.parse(bill.tenantShares as string) as TenantShare[]) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Nebenkostenabrechnung {bill.year}</h1>
        <p className="text-sm text-muted-foreground">
          {bill.property.name} · CHF {bill.amount.toFixed(2)}
        </p>
      </div>

      {/* Kostenpositionen */}
      {costItems.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">Kostenpositionen</h2>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Position</th>
                  <th className="text-right p-3">Betrag (CHF)</th>
                  <th className="text-left p-3">Verteilschlüssel</th>
                </tr>
              </thead>
              <tbody>
                {costItems.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3">{item.name}</td>
                    <td className="p-3 text-right font-mono">{item.amount.toFixed(2)}</td>
                    <td className="p-3 text-muted-foreground">
                      {item.key === 'sqm' ? 'Nach m²' : item.key === 'unit' ? 'Pro Einheit' : 'Nach Personen'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mieteranteile */}
      {tenantShares.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">Mieteranteile</h2>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Mieter</th>
                  {costItems.map((item, i) => (
                    <th key={i} className="text-right p-3">{item.name}</th>
                  ))}
                  <th className="text-right p-3">Gesamt</th>
                  <th className="text-right p-3">Akonto</th>
                  <th className="text-right p-3">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {tenantShares.map((share) => (
                  <tr key={share.tenantId} className="border-t">
                    <td className="p-3">{share.tenantName}</td>
                    {share.costBreakdown.map((b, i) => (
                      <td key={i} className="p-3 text-right font-mono">{b.share.toFixed(2)}</td>
                    ))}
                    <td className="p-3 text-right font-mono font-medium">{share.totalShare.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-muted-foreground">{share.akontoTotal.toFixed(2)}</td>
                    <td className={`p-3 text-right font-mono font-bold ${share.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {share.balance > 0 ? '+' : ''}{share.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Positiver Saldo = Nachzahlung · Negativer Saldo = Rückerstattung
          </p>
        </div>
      )}

      {tenantShares.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Keine Mieteranteile berechnet. Abrechnung wurde ohne Kostenpositionen erstellt.
        </p>
      )}
    </div>
  )
}
