'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getNotifications, markAllRead, markOneRead } from '@/app/[lang]/dashboard/notifications/_actions'
import type { Notification } from '@/lib/generated/prisma'

interface Props {
  unreadCount: number
}

export function NotificationBell({ unreadCount: initialUnreadCount }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loaded, setLoaded] = useState(false)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [pending, startTransition] = useTransition()

  async function handleOpen() {
    if (!loaded) {
      const data = await getNotifications()
      setNotifications(data)
      setLoaded(true)
    }
    setOpen(v => !v)
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    })
  }

  function handleMarkOne(n: Notification) {
    startTransition(async () => {
      if (!n.read) {
        await markOneRead(n.id)
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      if (n.link) {
        setOpen(false)
        // Prepend locale segment from current pathname (e.g. /de, /en)
        const localeMatch = pathname.match(/^\/(de|fr|en|it)/)
        const locale = localeMatch ? localeMatch[1] : 'de'
        router.push(`/${locale}${n.link}`)
      }
    })
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={handleOpen}>
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-primary text-xs text-white flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="fixed right-4 top-16 z-50 w-80 max-w-[calc(100vw-2rem)]">
          <Card className="p-0 overflow-hidden shadow-card-hover">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium text-foreground">Benachrichtigungen</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAll} disabled={pending} className="h-7 text-xs">
                  <Check className="h-3 w-3 mr-1" />Alle gelesen
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Keine Benachrichtigungen</p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkOne(n)}
                    className={`px-4 py-3 border-b border-border last:border-0 transition-colors ${
                      !n.read ? 'bg-secondary/50' : ''
                    } ${n.link || !n.read ? 'cursor-pointer hover:bg-muted/60 active:bg-muted' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      <div className={!n.read ? '' : 'pl-4'}>
                        <p className="text-sm text-foreground">{n.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleDateString('de-DE')}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
