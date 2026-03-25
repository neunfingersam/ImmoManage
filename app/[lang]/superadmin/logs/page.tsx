import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TicketStatus, MessageSource } from '@/lib/generated/prisma'

export default async function LogsPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPER_ADMIN') redirect('/403')

  const [tickets, messages] = await Promise.all([
    prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' }, take: 20,
      include: {
        tenant: { select: { name: true } },
        company: { select: { name: true } },
        property: { select: { name: true } },
      },
    }),
    prisma.message.findMany({
      where: { source: MessageSource.AI_ESCALATION },
      orderBy: { createdAt: 'desc' }, take: 10,
      include: {
        from: { select: { name: true } },
        company: { select: { name: true } },
      },
    }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Aktivitäts-Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Plattformweite Aktivitäten</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Letzte Tickets</h2>
        {tickets.map(t => (
          <Card key={t.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.company.name} · {t.property.name} · {t.tenant.name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={t.status === TicketStatus.OPEN ? 'destructive' : t.status === TicketStatus.IN_PROGRESS ? 'default' : 'secondary'}>
                {t.status === TicketStatus.OPEN ? 'Offen' : t.status === TicketStatus.IN_PROGRESS ? 'In Bearbeitung' : 'Erledigt'}
              </Badge>
              <span className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('de-DE')}</span>
            </div>
          </Card>
        ))}
      </section>

      {messages.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">KI-Eskalationen</h2>
          {messages.map(m => (
            <Card key={m.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{m.text.replace('[KI-Eskalation] ', '')}</p>
                <p className="text-xs text-muted-foreground">{m.company.name} · {m.from.name}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{new Date(m.createdAt).toLocaleDateString('de-DE')}</span>
            </Card>
          ))}
        </section>
      )}
    </div>
  )
}
