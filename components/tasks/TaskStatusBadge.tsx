import { Badge } from '@/components/ui/badge'

type Status = 'OFFEN' | 'IN_BEARBEITUNG' | 'ERLEDIGT'

const variants: Record<Status, 'secondary' | 'default' | 'outline'> = {
  OFFEN: 'secondary',
  IN_BEARBEITUNG: 'default',
  ERLEDIGT: 'outline',
}

const labels: Record<Status, string> = {
  OFFEN: 'Offen',
  IN_BEARBEITUNG: 'In Bearbeitung',
  ERLEDIGT: 'Erledigt',
}

export function TaskStatusBadge({ status }: { status: Status }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}
