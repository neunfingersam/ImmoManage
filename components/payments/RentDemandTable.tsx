'use client'

import { PaymentStatusBadge } from './PaymentStatusBadge'
import { Button } from '@/components/ui/button'
import { recordPaymentAction, sendReminderAction } from '@/app/[lang]/dashboard/payments/_actions'
import { useTranslations } from 'next-intl'

type RentDemandRow = {
  id: string
  month: Date
  amount: number
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  dueDate: Date
  tenantName: string
  unitNumber: string
  propertyName: string
  reminderLevel: number
}

export function RentDemandTable({ demands }: { demands: RentDemandRow[] }) {
  const t = useTranslations('payments')

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3">{t('month')}</th>
            <th className="text-left p-3">Mieter</th>
            <th className="text-left p-3">Objekt / Einheit</th>
            <th className="text-right p-3">Betrag (CHF)</th>
            <th className="text-left p-3">{t('dueDate')}</th>
            <th className="text-left p-3">{t('statusPending')}</th>
            <th className="text-right p-3">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {demands.map((d) => (
            <tr key={d.id} className="border-t hover:bg-muted/30 transition-colors">
              <td className="p-3">
                {new Date(d.month).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}
              </td>
              <td className="p-3">{d.tenantName}</td>
              <td className="p-3 text-muted-foreground">{d.propertyName} / {d.unitNumber}</td>
              <td className="p-3 text-right font-mono">{d.amount.toFixed(2)}</td>
              <td className="p-3">{new Date(d.dueDate).toLocaleDateString('de-CH')}</td>
              <td className="p-3"><PaymentStatusBadge status={d.status} /></td>
              <td className="p-3 text-right flex gap-2 justify-end">
                {d.status !== 'PAID' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => recordPaymentAction({
                        rentDemandId: d.id,
                        leaseId: '',
                        amount: d.amount,
                        paymentDate: new Date().toISOString(),
                      })}
                    >
                      Zahlung erfassen
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => sendReminderAction(d.id)}
                    >
                      Mahnung {d.reminderLevel < 3 ? d.reminderLevel + 1 : 3}
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" asChild>
                  <a href={`/api/payments/qr-invoice/${d.id}`} target="_blank">
                    QR
                  </a>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
