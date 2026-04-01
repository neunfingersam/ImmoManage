import { notFound } from 'next/navigation'
import { getStegBudgetWithIst, updateBudgetStatus } from '../_actions'

export default async function BudgetDetailPage({ params }: { params: Promise<{ lang: string; propertyId: string; year: string }> }) {
  const { propertyId, year } = await params
  const budget = await getStegBudgetWithIst(propertyId, parseInt(year))
  if (!budget) notFound()

  const totalBudget = budget.positionen.reduce((s, p) => s + p.budgetBetrag, 0)
  const totalIst = budget.positionen.reduce((s, p) => s + p.istBetrag, 0)
  const differenz = totalIst - totalBudget

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Budget {year}</h1>
        <span className={`rounded px-2 py-1 text-xs font-medium ${budget.status === 'VERABSCHIEDET' ? 'bg-green-100 text-green-700' : budget.status === 'ABGESCHLOSSEN' ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'}`}>
          {budget.status}
        </span>
      </div>

      {budget.status === 'ENTWURF' && (
        <form action={async () => { 'use server'; await updateBudgetStatus(budget.id, 'VERABSCHIEDET') }}>
          <button type="submit" className="mb-4 rounded bg-green-600 px-4 py-2 text-sm text-white">Als verabschiedet markieren</button>
        </form>
      )}
      {budget.status === 'VERABSCHIEDET' && (
        <form action={async () => { 'use server'; await updateBudgetStatus(budget.id, 'ABGESCHLOSSEN') }}>
          <button type="submit" className="mb-4 rounded bg-gray-600 px-4 py-2 text-sm text-white">Jahresabschluss: Abschliessen</button>
        </form>
      )}

      <table className="w-full text-sm border-collapse mb-6">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4">Kategorie</th><th className="pb-2 pr-4">Beschreibung</th>
            <th className="pb-2 pr-4 text-right">Budget CHF</th><th className="pb-2 pr-4 text-right">Ist CHF</th><th className="pb-2 text-right">Diff CHF</th>
          </tr>
        </thead>
        <tbody>
          {budget.positionen.map((pos) => {
            const diff = pos.istBetrag - pos.budgetBetrag
            return (
              <tr key={pos.id} className="border-b">
                <td className="py-2 pr-4 text-muted-foreground">{pos.kategorie}</td>
                <td className="py-2 pr-4">{pos.beschreibung}</td>
                <td className="py-2 pr-4 text-right">{pos.budgetBetrag.toFixed(2)}</td>
                <td className="py-2 pr-4 text-right">{pos.istBetrag.toFixed(2)}</td>
                <td className={`py-2 text-right ${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>{diff > 0 ? '+' : ''}{diff.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td colSpan={2} className="pt-3">Total</td>
            <td className="pt-3 text-right">{totalBudget.toFixed(2)}</td>
            <td className="pt-3 text-right">{totalIst.toFixed(2)}</td>
            <td className={`pt-3 text-right ${differenz > 0 ? 'text-red-600' : 'text-green-600'}`}>{differenz > 0 ? '+' : ''}{differenz.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
