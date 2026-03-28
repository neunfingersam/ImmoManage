'use client'

// components/layout/TenantSidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Home, AlertCircle, FolderOpen, MessageSquare, CalendarDays, Gauge, UserCircle, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileNavTrigger } from './MobileNav'

const primaryItems = [
  { key: 'myApartment', path: '/tenant', icon: Home },
  { key: 'tickets', path: '/tenant/tickets', icon: AlertCircle },
  { key: 'messages', path: '/tenant/messages', icon: MessageSquare },
  { key: 'documents', path: '/tenant/documents', icon: FolderOpen },
  { key: 'calendar', path: '/tenant/calendar', icon: CalendarDays },
]

const secondaryItems = [
  { key: 'meters', path: '/tenant/meters', icon: Gauge },
  { key: 'assistant', path: '/tenant/assistant', icon: Bot },
  { key: 'myProfile', path: '/tenant/profile', icon: UserCircle },
]

function TenantNavLinks({ upcomingEventsCount = 0 }: { upcomingEventsCount?: number }) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('nav')

  const renderItem = (item: typeof primaryItems[0]) => {
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
        <span className="flex-1">{t(item.key as Parameters<typeof t>[0])}</span>
        {showBadge && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            {upcomingEventsCount > 99 ? '99+' : upcomingEventsCount}
          </span>
        )}
      </Link>
    )
  }

  return (
    <nav className="flex-1 px-3 py-4 space-y-4">
      <div className="space-y-0.5">
        {primaryItems.map(renderItem)}
      </div>
      <div className="border-t border-border" />
      <div className="space-y-0.5">
        {secondaryItems.map(renderItem)}
      </div>
    </nav>
  )
}

export function TenantSidebar({ upcomingEventsCount = 0 }: { upcomingEventsCount?: number }) {
  return (
    <aside className="hidden md:flex h-full w-64 flex-col bg-card border-r border-border">
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ImmoManage" className="h-9 w-auto" />
      </div>
      <TenantNavLinks upcomingEventsCount={upcomingEventsCount} />
    </aside>
  )
}

export function TenantMobileNav({ upcomingEventsCount = 0 }: { upcomingEventsCount?: number }) {
  return (
    <MobileNavTrigger>
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ImmoManage" className="h-9 w-auto" />
      </div>
      <TenantNavLinks upcomingEventsCount={upcomingEventsCount} />
    </MobileNavTrigger>
  )
}
