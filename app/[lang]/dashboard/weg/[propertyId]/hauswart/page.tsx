import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getHauswartEntries, getHauswartMonthTotal } from './_actions'

export default async function HauswartPage({ params, searchParams }: {
  params: Promise<{ lang: string; propertyId: string }>
  searchParams: Promise<{ monat?: string; jahr?: string }>
}) {
  const { lang, propertyId } = await params
  const sp = await searchParams
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) notFound()

  const now = new Date()
  const monat = sp.monat ? parseInt(sp.monat) : now.getMonth() + 1
  const jahr = sp.jahr ? parseInt(sp.jahr) : now.getFullYear()

  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId: session.user.companyId },
  })
  if (!property) notFound()

  const [entries, totals] = await Promise.all([
    getHauswartEntries(propertyId, { monat, jahr }),
    getHauswartMonthTotal(propertyId, monat, jahr),
  ])

  const monthNames = ['Jan','Feb','Mrz','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Hauswart-Buchhaltung</h1>
          <p className="text-sm text-muted-foreground">{property.name}</p>
        </div>
        <Link href={`/${lang}/dashboard/weg/${propertyId}/hauswart/new`} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
          + Erfassen
        </Link>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {monthNames.map((m, i) => {
          const mon = i + 1
          return (
            <a key={mon} href={`?monat=${mon}&jahr=${jahr}`}
              className={`rounded px-3 py-1 text-sm border ${mon === monat ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
              {m}
            </a>
          )
        })}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Stunden', value: `${totals.stunden.toFixed(1)} h` },
          { label: 'Stundenkosten', value: `CHF ${totals.stundenkosten.toFixed(2)}` },
          { label: 'Auslagen', value: `CHF ${totals.auslagen.toFixed(2)}` },
          { label: 'Total', value: `CHF ${totals.total.toFixed(2)}` },
        ].map((item) => (
          <div key={item.label} className="rounded border p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-lg font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <a href={`/api/templates/hauswart-rapport?propertyId=${propertyId}&monat=${monat}&jahr=${jahr}`}
          target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
          PDF-Rapport exportieren
        </a>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Einträge für diesen Monat.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-4">Datum</th>
              <th className="pb-2 pr-4">Kategorie</th>
              <th className="pb-2 pr-4">Beschreibung</th>
              <th className="pb-2 pr-4 text-right">Std.</th>
              <th className="pb-2 text-right">CHF</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b hover:bg-muted/50">
                <td className="py-2 pr-4">{new Date(entry.datum).toLocaleDateString('de-CH')}</td>
                <td className="py-2 pr-4">{entry.kategorie}</td>
                <td className="py-2 pr-4">
                  <Link href={`/${lang}/dashboard/weg/${propertyId}/hauswart/${entry.id}/edit`} className="hover:underline">
                    {entry.beschreibung}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-right">{entry.stunden != null ? entry.stunden.toFixed(1) : '—'}</td>
                <td className="py-2 text-right">{entry.betrag != null ? entry.betrag.toFixed(2) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
