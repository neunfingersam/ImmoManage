'use client'

import { TaskStatusBadge } from './TaskStatusBadge'
import { updateTaskStatusAction, deleteTaskAction } from '@/app/[lang]/dashboard/tasks/_actions'
import { Button } from '@/components/ui/button'

type Task = {
  id: string
  title: string
  description: string | null
  type: string
  dueDate: Date
  status: 'OFFEN' | 'IN_BEARBEITUNG' | 'ERLEDIGT'
  propertyName?: string
  tenantName?: string
}

const typeLabels: Record<string, string> = {
  WARTUNG: 'Wartung',
  REPARATUR: 'Reparatur',
  VERTRAGSVERLAENGERUNG: 'Vertragsverlängerung',
  BESICHTIGUNG: 'Besichtigung',
  SONSTIGES: 'Sonstiges',
}

export function TaskCard({ task }: { task: Task }) {
  const isOverdue = task.status !== 'ERLEDIGT' && new Date(task.dueDate) < new Date()

  return (
    <div className={`border rounded-xl p-4 space-y-2 ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{task.title}</p>
          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
        </div>
        <TaskStatusBadge status={task.status} />
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>📋 {typeLabels[task.type] ?? task.type}</span>
        <span>📅 {new Date(task.dueDate).toLocaleDateString('de-CH')}</span>
        {task.propertyName && <span>🏠 {task.propertyName}</span>}
        {task.tenantName && <span>👤 {task.tenantName}</span>}
        {isOverdue && <span className="text-destructive font-medium">⚠ Überfällig</span>}
      </div>
      <div className="flex gap-2 pt-1">
        {task.status === 'OFFEN' && (
          <Button size="sm" variant="outline" onClick={() => updateTaskStatusAction(task.id, 'IN_BEARBEITUNG')}>
            Starten
          </Button>
        )}
        {task.status === 'IN_BEARBEITUNG' && (
          <Button size="sm" onClick={() => updateTaskStatusAction(task.id, 'ERLEDIGT')}>
            Erledigen
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => deleteTaskAction(task.id)}>
          Löschen
        </Button>
      </div>
    </div>
  )
}
