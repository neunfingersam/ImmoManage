// components/layout/DashboardHeader.tsx
'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from './NotificationBell'
import { type Role } from '@/lib/generated/prisma'

// Lesbarer Rollen-Name für die Anzeige
const rollenBezeichnung: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  VERMIETER: 'Vermieter',
  MIETER: 'Mieter',
}

interface DashboardHeaderProps {
  userName: string
  userEmail: string
  userRole: Role
}

export function DashboardHeader({ userName, userEmail, userRole }: DashboardHeaderProps) {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div /> {/* Platzhalter links */}

      <div className="flex items-center gap-3">
        <NotificationBell anzahlUngelesen={0} />

        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
            {initials}
          </div>
          {/* User info */}
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{rollenBezeichnung[userRole]}</p>
          </div>
          {/* Logout button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            title="Abmelden"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  )
}
