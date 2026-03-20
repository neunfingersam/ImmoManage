// components/layout/NotificationBell.tsx
'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface NotificationBellProps {
  anzahlUngelesen?: number
}

// Notification-Bell — Placeholder für Block 3
export function NotificationBell({ anzahlUngelesen = 0 }: NotificationBellProps) {
  return (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5 text-muted-foreground" />
      {anzahlUngelesen > 0 && (
        <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-primary p-0 text-xs text-primary-foreground flex items-center justify-center">
          {anzahlUngelesen > 9 ? '9+' : anzahlUngelesen}
        </Badge>
      )}
    </Button>
  )
}
