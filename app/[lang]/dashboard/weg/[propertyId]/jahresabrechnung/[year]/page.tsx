import { notFound } from 'next/navigation'
import { getJahresabrechnungen, updateJahresabrechnungStatus } from '../_actions'

export default async function JahresabrechnungDetailPage({ params }: { params: Promise<{ lang: string; propertyId: string; year: string }> }) {
  const { lang, propertyId, year } = await params
  const alle = await getJahresabrechnungen(propertyId)
  const ja = alle.find((a) => a.jahr === parseInt(year))
  if (!ja) notFound()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Jahresabrechnung {year}</h1>
        <span className="rounded bg-muted px-2 py-1 text-xs">{ja.status}</span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Total Ausgaben</p><p className="text-lg font-semibold">CHF {ja.totalAusgaben.toFixed(2)}</p></div>
        <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Fondsbeitrag</p><p className="text-lg font-semibold">CHF {ja.fondsBeitrag.toFixed(2)}</p></div>
      </div>

      {ja.status === 'ENTWURF' && (
        <form action={async () => { 'use server'; await updateJahresabrechnungStatus(ja.id, 'VERSANDT') }}>
          <button type="submit" className="mb-4 rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Als versandt markieren</button>
        </form>
      )}

      <h2 className="mb-3 font-medium">Eigentümer-Abrechnungen</h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4">Eigentümer</th>
            <th className="pb-2 pr-4 text-right">Kostenanteil</th>
            <th className="pb-2 pr-4 text-right">Fondsanteil</th>
            <th className="pb-2 pr-4 text-right">Vorauszahlungen</th>
            <th className="pb-2 pr-4 text-right">Saldo</th>
            <th className="pb-2">PDF</th>
          </tr>
        </thead>
        <tbody>
          {ja.ownerStatements.map((stmt) => (
            <tr key={stmt.id} className="border-b">
              <td className="py-2 pr-4">{stmt.owner.user.name}</td>
              <td className="py-2 pr-4 text-right">{stmt.kostenanteil.toFixed(2)}</td>
              <td className="py-2 pr-4 text-right">{stmt.fondsanteil.toFixed(2)}</td>
              <td className="py-2 pr-4 text-right">{stmt.vorauszahlungen.toFixed(2)}</td>
              <td className={`py-2 pr-4 text-right font-medium ${stmt.saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stmt.saldo > 0 ? '+' : ''}{stmt.saldo.toFixed(2)}
              </td>
              <td className="py-2">
                <a href={`/api/templates/steg-owner-statement?statementId=${stmt.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">PDF</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
