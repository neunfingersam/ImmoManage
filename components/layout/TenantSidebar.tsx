'use client'

// components/layout/TenantSidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Home, AlertCircle, FolderOpen, MessageSquare, Bot, Building, CalendarDays, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileNavTrigger } from './MobileNav'

const navItems = [
  { label: 'Meine Wohnung', path: '/tenant', icon: Home },
  { label: 'Schadensmeldungen', path: '/tenant/tickets', icon: AlertCircle },
  { label: 'Meine Dokumente', path: '/tenant/documents', icon: FolderOpen },
  { label: 'Nachrichten', path: '/tenant/messages', icon: MessageSquare },
  { label: 'KI-Assistent', path: '/tenant/assistant', icon: Bot },
  { label: 'Meine Termine', path: '/tenant/calendar', icon: CalendarDays },
  { label: 'Zählerstände', path: '/tenant/meters', icon: Gauge },
]

function TenantNavLinks({ upcomingEventsCount = 0 }: { upcomingEventsCount?: number }) {
  const pathname = usePathname()
  const locale = useLocale()

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map((item) => {
        const href = `/${locale}${item.path}`
        const isActive =
          item.path === '/tenant'
            ? pathname === `/${locale}/tenant`
            : pathname.startsWith(href)

        const showBadge = item.path === '/tenant/calendar' && upcomingEventsCount > 0

        return (
          <Link
            key={item.path}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {showBadge && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {upcomingEventsCount > 99 ? '99+' : upcomingEventsCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export function TenantSidebar({ upcomingEventsCount = 0 }: { upcomingEventsCount?: number }) {
  return (
    <aside className="hidden md:flex h-full w-64 flex-col bg-card border-r border-border">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary">
          <Building className="h-5 w-5 text-primary-foreground" />
        </div>
        <p className="font-serif text-base text-foreground">ImmoManage</p>
      </div>

      <TenantNavLinks upcomingEventsCount={upcomingEventsCount} />
    </aside>
  )
}

export function TenantMobileNav({ upcomingEventsCount = 0 }: { upcomingEventsCount?: number }) {
  return (
    <MobileNavTrigger>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary">
          <Building className="h-5 w-5 text-primary-foreground" />
        </div>
        <p className="font-serif text-base text-foreground">ImmoManage</p>
      </div>
      <TenantNavLinks upcomingEventsCount={upcomingEventsCount} />
    </MobileNavTrigger>
  )
}
