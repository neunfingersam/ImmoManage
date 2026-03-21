import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { getThreads, getMyTenants } from './_actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)
  const threads = await getThreads()
  const tenants = await getMyTenants()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Nachrichten</h1>
          <p className="text-sm text-muted-foreground mt-1">{threads.length} Gespräch{threads.length !== 1 ? 'e' : ''}</p>
        </div>
      </div>

      {tenants.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Neue Nachricht an</h2>
          <div className="flex flex-wrap gap-2">
            {tenants.map(t => (
              <Button key={t.id} render={<Link href={`/dashboard/messages/${t.id}`} />} variant="outline" size="sm">
                {t.name}
              </Button>
            ))}
          </div>
        </section>
      )}

      {threads.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-7 w-7" />} titel="Keine Nachrichten" beschreibung="Starten Sie ein Gespräch mit einem Mieter." />
      ) : (
        <div className="space-y-2">
          {threads.map(m => {
            const partnerId = m.fromId === session?.user?.id ? m.toId : m.fromId
            const partnerName = m.fromId === session?.user?.id ? m.to.name : m.from.name
            return (
              <Link key={partnerId} href={`/dashboard/messages/${partnerId}`}>
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
