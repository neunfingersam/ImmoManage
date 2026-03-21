import { Badge } from '@/components/ui/badge'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  OPEN: { label: 'Offen', variant: 'destructive' },
  IN_PROGRESS: { label: 'In Bearbeitung', variant: 'default' },
  DONE: { label: 'Erledigt', variant: 'secondary' },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Niedrig', className: 'bg-muted text-muted-foreground' },
  MEDIUM: { label: 'Mittel', className: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'Hoch', className: 'bg-destructive/10 text-destructive' },
}

export function TicketStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, variant: 'outline' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function TicketPriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority] ?? { label: priority, className: '' }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>{config.label}</span>
}
