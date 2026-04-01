import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getJahresabrechnungen, generateJahresabrechnung } from './_actions'

export default async function JahresabrechnungPage({ params }: { params: Promise<{ lang: string; propertyId: string }> }) {
  const { lang, propertyId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) notFound()

  const property = await prisma.property.findFirst({ where: { id: propertyId, companyId: session.user.companyId } })
  if (!property) notFound()

  const abrechnungen = await getJahresabrechnungen(propertyId)
  const currentYear = new Date().getFullYear()
  const statusLabel = { ENTWURF: 'Entwurf', VERSANDT: 'Versandt', GENEHMIGT: 'Genehmigt' }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Jahresabrechnungen — {property.name}</h1>
        <form action={async () => { 'use server'; await generateJahresabrechnung(propertyId, currentYear) }}>
          <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">{currentYear} generieren</button>
        </form>
      </div>
      {abrechnungen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Jahresabrechnung. &quot;Generieren&quot; klicken um eine zu erstellen.</p>
      ) : (
        <ul className="divide-y rounded border">
          {abrechnungen.map((ja) => (
            <li key={ja.id}>
              <Link href={`/${lang}/dashboard/weg/${propertyId}/jahresabrechnung/${ja.jahr}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted">
                <div>
                  <p className="font-medium">Jahresabrechnung {ja.jahr}</p>
                  <p className="text-xs text-muted-foreground">{statusLabel[ja.status]}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">CHF {ja.totalAusgaben.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{ja.ownerStatements.length} Eigentümer</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
