import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TicketStatusBadge, TicketPriorityBadge } from './TicketStatusBadge'
import type { Ticket, Property, Unit, User } from '@/lib/generated/prisma'

type TicketWithDetails = Ticket & {
  tenant: Pick<User, 'id' | 'name'>
  property: Pick<Property, 'id' | 'name'>
  unit: Pick<Unit, 'id' | 'unitNumber'> | null
}

export function TicketCard({ ticket, detailHref }: { ticket: TicketWithDetails; detailHref: string }) {
  const date = new Date(ticket.createdAt).toLocaleDateString('de-DE')

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{ticket.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ticket.property.name}{ticket.unit ? ` · ${ticket.unit.unitNumber}` : ''} · {ticket.tenant.name}
          </p>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TicketPriorityBadge priority={ticket.priority} />
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <Button render={<Link href={detailHref} />} variant="outline" size="sm">
          Details
        </Button>
      </div>
    </Card>
  )
}
