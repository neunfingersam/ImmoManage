import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatActivityAction } from '@/lib/activity'
import { getTranslations } from 'next-intl/server'

export default async function ActivityPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const t = await getTranslations('activity')

  const logs = await prisma.activityLog.findMany({
    where: { companyId: session.user.companyId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('title' as never) ?? 'Aktivitätsprotokoll'}</h1>

      {logs.length === 0 ? (
        <p className="text-muted-foreground">Noch keine Aktivitäten aufgezeichnet.</p>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">{t('timestamp' as never) ?? 'Zeitpunkt'}</th>
                <th className="text-left p-3">{t('user' as never) ?? 'Benutzer'}</th>
                <th className="text-left p-3">{t('action' as never) ?? 'Aktion'}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('de-CH')}
                  </td>
                  <td className="p-3">{log.user.name}</td>
                  <td className="p-3">
                    {formatActivityAction(log.action, (log.meta ?? {}) as Record<string, unknown>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
