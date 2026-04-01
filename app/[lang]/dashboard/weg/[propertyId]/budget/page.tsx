import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStegBudgets } from './_actions'

export default async function BudgetPage({ params }: { params: Promise<{ lang: string; propertyId: string }> }) {
  const { lang, propertyId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) notFound()

  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) notFound()

  const budgets = await getStegBudgets(propertyId)
  const statusColor = { ENTWURF: 'text-orange-600', VERABSCHIEDET: 'text-green-600', ABGESCHLOSSEN: 'text-gray-500' }
  const statusLabel = { ENTWURF: 'Entwurf', VERABSCHIEDET: 'Verabschiedet', ABGESCHLOSSEN: 'Abgeschlossen' }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Jahresbudgets — {property.name}</h1>
        <Link href={`/${lang}/dashboard/weg/${propertyId}/budget/new`} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">+ Budget erstellen</Link>
      </div>
      {budgets.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch kein Budget erstellt.</p>
      ) : (
        <ul className="divide-y rounded border">
          {budgets.map((b) => (
            <li key={b.id}>
              <Link href={`/${lang}/dashboard/weg/${propertyId}/budget/${b.jahr}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted">
                <div>
                  <p className="font-medium">{b.jahr}</p>
                  <p className={`text-xs ${statusColor[b.status]}`}>{statusLabel[b.status]}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">CHF {b.positionen.reduce((s, p) => s + p.budgetBetrag, 0).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{b.positionen.length} Positionen</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
