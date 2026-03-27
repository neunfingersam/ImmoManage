import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { computeTaxSummary } from '@/lib/tax'
import { TaxDashboard } from './TaxDashboard'

export default async function TaxPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ year?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    const { lang } = await params
    redirect(`/${lang}/auth/login`)
  }

  const { year: yearParam } = await searchParams
  const year = parseInt(yearParam ?? String(new Date().getFullYear() - 1))

  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  let summary
  let errorMessage: string | null = null
  try {
    summary = await computeTaxSummary(session.user.companyId, year)
  } catch (e: any) {
    errorMessage = e?.message ?? String(e)
  }

  if (errorMessage || !summary) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="font-serif text-2xl text-foreground">Steuermappe – Diagnosemodus</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm font-mono text-red-800 whitespace-pre-wrap">
          {errorMessage ?? 'Unbekannter Fehler'}
        </div>
        <p className="text-xs text-muted-foreground">companyId: {session.user.companyId} · year: {year}</p>
      </div>
    )
  }

  return (
    <Suspense>
      <TaxDashboard summary={summary} availableYears={availableYears} />
    </Suspense>
  )
}
