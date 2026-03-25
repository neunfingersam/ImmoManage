import { Badge } from '@/components/ui/badge'

type Status = 'PENDING' | 'PAID' | 'OVERDUE'

const variants: Record<Status, 'default' | 'secondary' | 'destructive'> = {
  PAID: 'default',
  PENDING: 'secondary',
  OVERDUE: 'destructive',
}

const labels: Record<Status, string> = {
  PAID: 'Bezahlt',
  PENDING: 'Ausstehend',
  OVERDUE: 'Überfällig',
}

export function PaymentStatusBadge({ status }: { status: Status }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}
