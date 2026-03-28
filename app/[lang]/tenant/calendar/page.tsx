import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CalendarDays } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { getTranslations, getLocale } from 'next-intl/server'

type EventItem = {
  id: string
  title: string
  date: Date
  type: string
  property?: { name: string } | null
  unit?: { unitNumber: string } | null
}

export default async function TenantCalendarPage() {
  const [t, locale, session] = await Promise.all([
    getTranslations('tenant'),
    getLocale(),
    getServerSession(authOptions),
  ])
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

  const typeKeyMap: Record<string, string> = {
    VERTRAGSENDE: 'typeVERTRAGSENDE',
    ABLESUNG: 'typeABLESUNG',
    KUENDIGUNG: 'typeKUENDIGUNG',
    WARTUNG: 'typeWARTUNG',
    SONSTIGES: 'typeSONSTIGES',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('myCalendar')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('upcomingCount', { count: upcoming.length })}</p>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-7 w-7" />} titel={t('noEventsTitle')} beschreibung={t('noEventsDesc')} />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('upcoming')}</h2>
              {upcoming.map(e => (
                <Card key={e.id} className="p-4 flex items-center gap-4">
                  <div className="text-center shrink-0 w-12">
                    <p className="text-lg font-serif text-foreground">{new Date(e.date).getDate()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString(locale, { month: 'short' })}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.property?.name}{e.unit ? ` · ${t('unitLabel', { number: e.unit.unitNumber })}` : ` · ${t('wholeBuilding')}`}
                    </p>
                  </div>
                  <Badge variant="outline">{typeKeyMap[e.type] ? t(typeKeyMap[e.type] as Parameters<typeof t>[0]) : e.type}</Badge>
                </Card>
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-2 opacity-60">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('past')}</h2>
              {past.slice(0, 5).map(e => (
                <Card key={e.id} className="p-4 flex items-center gap-4">
                  <div className="text-center shrink-0 w-12">
                    <p className="text-lg font-serif">{new Date(e.date).getDate()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString(locale, { month: 'short' })}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{e.title}</p>
                  </div>
                  <Badge variant="outline">{typeKeyMap[e.type] ? t(typeKeyMap[e.type] as Parameters<typeof t>[0]) : e.type}</Badge>
                </Card>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
