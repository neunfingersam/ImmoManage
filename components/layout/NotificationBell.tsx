'use client'

import { useState, useTransition } from 'react'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getNotifications, markAllRead } from '@/app/[lang]/dashboard/notifications/_actions'
import type { Notification } from '@/lib/generated/prisma'

interface Props {
  unreadCount: number
}

export function NotificationBell({ unreadCount }: Props) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loaded, setLoaded] = useState(false)
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
        <div className="absolute right-0 top-10 z-50 w-80">
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
                  <div key={n.id} className={`px-4 py-3 border-b border-border last:border-0 ${!n.read ? 'bg-secondary/50' : ''}`}>
                    <p className="text-sm text-foreground">{n.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleDateString('de-DE')}</p>
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
