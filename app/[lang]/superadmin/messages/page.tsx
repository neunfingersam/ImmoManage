import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSuperAdminThreads } from './_actions'

export default async function SuperAdminMessagesPage() {
  const session = await getServerSession(authOptions)
  const threads = await getSuperAdminThreads()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Nachrichten</h1>
        <p className="text-sm text-muted-foreground mt-1">{threads.length} Gespräch{threads.length !== 1 ? 'e' : ''}</p>
      </div>

      {threads.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-7 w-7" />} titel="Keine Nachrichten" beschreibung="Noch keine Nachrichten von Administratoren." />
      ) : (
        <div className="space-y-2">
          {threads.map(m => {
            const partnerId = m.fromId === session?.user?.id ? m.toId : m.fromId
            const partnerName = m.fromId === session?.user?.id ? m.to.name : m.from.name
            return (
              <Link key={partnerId} href={`superadmin/messages/${partnerId}`}>
                <Card className="p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-medium shrink-0">
                    {partnerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{partnerName}</p>
                    <p className="text-sm text-muted-foreground truncate">{m.text}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(m.createdAt).toLocaleDateString('de-DE')}</span>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
