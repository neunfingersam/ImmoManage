import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CalendarDays } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'

const typeLabels: Record<string, string> = {
  VERTRAGSENDE: 'Vertragsende', ABLESUNG: 'Ablesung', KUENDIGUNG: 'Kündigung',
  WARTUNG: 'Wartung', SONSTIGES: 'Sonstiges',
}

type EventItem = {
  id: string
  title: string
  date: Date
  type: string
  property?: { name: string } | null
  unit?: { unitNumber: string } | null
}

export default async function TenantCalendarPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.companyId) return null

  // Aktive Leases des Mieters
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leases = await (prisma.lease as any).findMany({
    where: { tenantId: session.user.id, status: 'ACTIVE' },
    select: { unit: { select: { id: true, propertyId: true } } },
  }) as Array<{ unit: { id: string; propertyId: string } }>

  const unitIds = leases.map(l => l.unit.id)
  const propertyIds = leases.map(l => l.unit.propertyId)

  // Events die den Mieter betreffen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = await (prisma.calendarEvent as any).findMany({
    where: {
      companyId: session.user.companyId,
      OR: [
        { unitId: { in: unitIds } },
        { propertyId: { in: propertyIds }, unitId: null },
      ],
    },
    include: {
      property: { select: { name: true } },
      unit: { select: { unitNumber: true } },
    },
    orderBy: { date: 'asc' },
  }) as EventItem[]

  const now = new Date()
  const upcoming = events.filter(e => new Date(e.date) >= now)
  const past = events.filter(e => new Date(e.date) < now)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Meine Termine</h1>
        <p className="text-sm text-muted-foreground mt-1">{upcoming.length} bevorstehend</p>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-7 w-7" />} titel="Keine Termine" beschreibung="Aktuell keine Termine für Ihre Wohnung." />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Bevorstehend</h2>
              {upcoming.map(e => (
                <Card key={e.id} className="p-4 flex items-center gap-4">
                  <div className="text-center shrink-0 w-12">
                    <p className="text-lg font-serif text-foreground">{new Date(e.date).getDate()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString('de-DE', { month: 'short' })}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.property?.name}{e.unit ? ` · Einheit ${e.unit.unitNumber}` : ' · Gesamtes Haus'}
                    </p>
                  </div>
                  <Badge variant="outline">{typeLabels[e.type] ?? e.type}</Badge>
                </Card>
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-2 opacity-60">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Vergangen</h2>
              {past.slice(0, 5).map(e => (
                <Card key={e.id} className="p-4 flex items-center gap-4">
                  <div className="text-center shrink-0 w-12">
                    <p className="text-lg font-serif">{new Date(e.date).getDate()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString('de-DE', { month: 'short' })}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{e.title}</p>
                  </div>
                  <Badge variant="outline">{typeLabels[e.type] ?? e.type}</Badge>
                </Card>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
