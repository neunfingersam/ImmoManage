// components/layout/DashboardHeader.tsx
// Server Component — lädt ungelesene Notifications serverseitig
import { NotificationBell } from './NotificationBell'
import { LogoutButton } from './LogoutButton'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { getUnreadCount } from '@/app/[lang]/dashboard/notifications/_actions'
import { type Role } from '@/lib/generated/prisma'
import { getTranslations } from 'next-intl/server'

interface DashboardHeaderProps {
  userName: string
  userEmail: string
  userRole: Role
  mobileNav?: React.ReactNode
}

export async function DashboardHeader({ userName, userEmail, userRole, mobileNav }: DashboardHeaderProps) {
  const [unreadCount, t] = await Promise.all([getUnreadCount(), getTranslations('roles')])

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      {/* Left side: mobile nav trigger (hidden on desktop) */}
      <div className="flex items-center">
        {mobileNav}
      </div>

      <div className="flex items-center gap-3">
        <LocaleSwitcher />
        <NotificationBell unreadCount={unreadCount} />

        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
            {initials}
          </div>
          {/* User info */}
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{t(userRole)}</p>
          </div>
          {/* Logout button */}
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
