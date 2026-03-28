import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MessageBubble } from '@/components/messages/MessageBubble'
import { MessageInput } from '@/components/messages/MessageInput'
import { getMyMessages, getMyVermieter, sendTenantMessage } from './_actions'
import { MessageSquare } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { getTranslations } from 'next-intl/server'

export default async function TenantMessagesPage() {
  const [t, session] = await Promise.all([
    getTranslations('tenant'),
    getServerSession(authOptions),
  ])
  if (!session?.user?.id) return null

  const [messages, vermieter] = await Promise.all([getMyMessages(), getMyVermieter()])

  if (!vermieter) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-2xl text-foreground">{t('messages')}</h1>
        <EmptyState
          icon={<MessageSquare className="h-7 w-7" />}
          titel={t('noContactTitle')}
          beschreibung={t('noContactDesc')}
        />
      </div>
    )
  }

  async function handleSend(data: { toId: string; text: string }) {
    'use server'
    return sendTenantMessage(data)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('messages')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('contactPerson', { name: vermieter.name })}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 py-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">{t('noMessages')}</p>
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

      <MessageInput onSend={handleSend} toId={vermieter.id} />
    </div>
  )
}
