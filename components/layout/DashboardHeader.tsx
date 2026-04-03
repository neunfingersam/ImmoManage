// components/layout/DashboardHeader.tsx
// Server Component — lädt ungelesene Notifications serverseitig
import { NotificationBell } from './NotificationBell'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { UserMenu } from './UserMenu'
import { getUnreadCount } from '@/app/[lang]/dashboard/notifications/_actions'
import { type Role } from '@/lib/generated/prisma'
import { getTranslations } from 'next-intl/server'

interface DashboardHeaderProps {
  userName: string
  userEmail: string
  userRole: Role
  profilePath: string
  mobileNav?: React.ReactNode
}

export async function DashboardHeader({ userName, userEmail, userRole, profilePath, mobileNav }: DashboardHeaderProps) {
  const [unreadCount, t] = await Promise.all([getUnreadCount(), getTranslations('roles')])

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center">
        {mobileNav}
      </div>

      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <NotificationBell unreadCount={unreadCount} />
        <UserMenu
          userName={userName}
          userEmail={userEmail}
          roleLabel={t(userRole)}
          profilePath={profilePath}
        />
      </div>
    </header>
  )
}
