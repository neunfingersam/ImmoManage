// app/dashboard/agent-logs/page.tsx
import { Bot } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function AgentLogsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const chats = await prisma.agentChat.findMany({
    where: { companyId: session.user.companyId },
    include: {
      tenant: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">KI-Assistent Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {chats.length} Gespräch{chats.length !== 1 ? 'e' : ''}
        </p>
      </div>
      {chats.length === 0 ? (
        <EmptyState
          icon={<Bot className="h-7 w-7" />}
          titel="Keine Logs"
          beschreibung="Noch keine KI-Chats von Mietern."
        />
      ) : (
        <div className="space-y-2">
          {chats.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{c.tenant.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.messages[0]?.content?.slice(0, 80) ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.messages.some((m) => m.wasEscalated) && (
                    <Badge variant="destructive" className="text-xs">
                      Eskaliert
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString('de-DE')}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
