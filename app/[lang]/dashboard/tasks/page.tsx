import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TaskCard } from '@/components/tasks/TaskCard'
import { getTranslations } from 'next-intl/server'

export default async function TasksPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const t = await getTranslations('tasks')

  const tasks = await prisma.task.findMany({
    where: { companyId: session.user.companyId },
    include: {
      property: { select: { name: true } },
      tenant: { select: { name: true } },
    },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  })

  const byStatus = {
    OFFEN: tasks.filter((task) => task.status === 'OFFEN'),
    IN_BEARBEITUNG: tasks.filter((task) => task.status === 'IN_BEARBEITUNG'),
    ERLEDIGT: tasks.filter((task) => task.status === 'ERLEDIGT'),
  }

  const statusLabels: Record<string, string> = {
    OFFEN: t('statusOffen' as never) ?? 'Offen',
    IN_BEARBEITUNG: t('statusInBearbeitung' as never) ?? 'In Bearbeitung',
    ERLEDIGT: t('statusErledigt' as never) ?? 'Erledigt',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title' as never) ?? 'Aufgaben'}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['OFFEN', 'IN_BEARBEITUNG', 'ERLEDIGT'] as const).map((status) => (
          <div key={status}>
            <h2 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
              {statusLabels[status]}
              {' '}
              <span className="text-xs bg-muted rounded-full px-2 py-0.5 ml-1">{byStatus[status].length}</span>
            </h2>
            <div className="space-y-3">
              {byStatus[status].map((task) => (
                <TaskCard
                  key={task.id}
                  task={{
                    ...task,
                    propertyName: task.property?.name ?? undefined,
                    tenantName: task.tenant?.name ?? undefined,
                  }}
                />
              ))}
              {byStatus[status].length === 0 && (
                <p className="text-sm text-muted-foreground italic">Keine Aufgaben</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
