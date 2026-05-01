// app/[lang]/dashboard/billing/[id]/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { TenantShare, CostItem } from '@/lib/utility-billing'

export default async function BillingDetailPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const { id } = await params
  const t = await getTranslations('billing')

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
        <h1 className="font-serif text-2xl text-foreground">{t('title')} {bill.year}</h1>
        <p className="text-sm text-muted-foreground">
          {bill.property.name} · CHF {bill.amount.toFixed(2)}
        </p>
      </div>

      {/* Kostenpositionen */}
      {costItems.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">{t('costItems')}</h2>
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">{t('costName')}</th>
                  <th className="text-right p-3">{t('costAmount')}</th>
                  <th className="text-left p-3">{t('distributionKey')}</th>
                </tr>
              </thead>
              <tbody>
                {costItems.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3">{item.name}</td>
                    <td className="p-3 text-right font-mono">{item.amount.toFixed(2)}</td>
                    <td className="p-3 text-muted-foreground">
                      {item.key === 'sqm' ? t('keySqm') : item.key === 'unit' ? t('keyUnit') : t('keyPersons')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Mieteranteile */}
      {tenantShares.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">{t('tenantShare')}</h2>
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">{t('colTenant')}</th>
                  {costItems.map((item, i) => (
                    <th key={i} className="text-right p-3">{item.name}</th>
                  ))}
                  <th className="text-right p-3">{t('colTotal')}</th>
                  <th className="text-right p-3">Akonto</th>
                  <th className="text-right p-3">{t('balance')}</th>
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
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('underpaid')} = + · {t('overpaid')} = -
          </p>
        </div>
      )}

      {tenantShares.length === 0 && (
        <p className="text-muted-foreground text-sm">{t('empty')}</p>
      )}
    </div>
  )
}
