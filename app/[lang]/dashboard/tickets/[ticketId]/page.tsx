import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, MapPin, Clock, Home, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/tickets/TicketStatusBadge'
import { TicketCommentForm } from '@/components/tickets/TicketCommentForm'
import { TicketStatusForm } from '@/components/tickets/TicketStatusForm'
import { getTicket, updateTicketStatus, addComment, updateRepairCost } from '../_actions'
import { RepairCostForm } from '@/components/tickets/RepairCostForm'

function parseImages(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as string[]
  try { return JSON.parse(raw as string) } catch { return [] }
}

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params
  const ticket = await getTicket(ticketId)
  if (!ticket) notFound()

  const images = parseImages(ticket.images)
  const date = new Date(ticket.createdAt).toLocaleDateString('de-DE')

  async function handleStatusUpdate(data: { status: string }) {
    'use server'
    return updateTicketStatus(ticketId, data)
  }

  async function handleComment(data: { text: string }) {
    'use server'
    return addComment(ticketId, data)
  }

  async function handleRepairCost(cost: number | null) {
    'use server'
    return updateRepairCost(ticketId, cost)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button render={<Link href="/dashboard/tickets" />} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl text-foreground">{ticket.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{ticket.property.name}{ticket.unit ? ` · ${ticket.unit.unitNumber}` : ''}</span>
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{ticket.tenant.name}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{date}</span>
            {(ticket as any).scope === 'BUILDING'
              ? <span className="flex items-center gap-1 text-amber-600"><Building2 className="h-3.5 w-3.5" />Ganzes Gebäude</span>
              : <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5" />Wohnung</span>
            }
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TicketPriorityBadge priority={ticket.priority} />
          <TicketStatusBadge status={ticket.status} />
        </div>
      </div>

      <Card className="p-4 text-sm text-foreground whitespace-pre-wrap">{ticket.description}</Card>

      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Fotos</p>
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} className="h-28 w-28 rounded-lg object-cover border hover:opacity-90 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}

      <Card className="p-4 space-y-3">
        <TicketStatusForm currentStatus={ticket.status} onUpdate={handleStatusUpdate} />
        <RepairCostForm currentCost={(ticket as any).repairCost ?? null} onUpdate={handleRepairCost} />
      </Card>

      <div className="space-y-4">
        <h2 className="font-medium text-foreground">Kommentare ({ticket.comments.length})</h2>
        {ticket.comments.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground">{c.author.name}</span>
              <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString('de-DE')}</span>
            </div>
            <p className="text-sm text-muted-foreground">{c.text}</p>
          </Card>
        ))}
        <Card className="p-4">
          <TicketCommentForm onSubmit={handleComment} />
        </Card>
      </div>
    </div>
  )
}
