import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MessageBubble } from '@/components/messages/MessageBubble'
import { MessageInput } from '@/components/messages/MessageInput'
import { MessagePoller } from '@/components/messages/MessagePoller'
import { getThread, getPartner, sendMessage } from '../_actions'

export default async function ThreadPage({ params }: { params: Promise<{ partnerId: string }> }) {
  const { partnerId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const [messages, partner] = await Promise.all([
    getThread(partnerId),
    getPartner(partnerId),
  ])

  if (!partner) notFound()

  async function handleSend(data: { toId: string; text: string }) {
    'use server'
    return sendMessage(data)
  }

  return (
    <div className="flex flex-col flex-1 sm:h-[calc(100vh-8rem)] max-w-2xl space-y-4">
      <MessagePoller />
      <div className="flex items-center gap-3">
        <Button render={<Link href="/dashboard/messages" />} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück
        </Button>
        <h1 className="font-serif text-xl text-foreground">{partner.name}</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 py-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Noch keine Nachrichten. Schreiben Sie die erste!</p>
        )}
        {messages.map(m => (
          <MessageBubble
            key={m.id}
            text={m.text}
            senderName={m.from.name}
            isMine={m.fromId === session.user.id}
            date={new Date(m.createdAt)}
          />
        ))}
      </div>

      <MessageInput
        onSend={handleSend}
        toId={partnerId}
        showSuggest={session.user.role !== 'MIETER'}
        lastMessage={messages.filter(m => m.fromId !== session.user.id).at(-1)?.text}
        conversationContext={messages.slice(-6).map(m => `${m.from.name}: ${m.text}`).join('\n')}
      />
    </div>
  )
}
