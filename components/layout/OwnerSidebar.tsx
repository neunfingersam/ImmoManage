'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Home, AlertCircle, FolderOpen, MessageSquare, Calculator, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileNavTrigger } from './MobileNav'

const primaryItems = [
  { key: 'ownerOverview', path: '/owner', icon: Home },
  { key: 'tickets', path: '/owner/tickets', icon: AlertCircle },
  { key: 'messages', path: '/owner/messages', icon: MessageSquare },
  { key: 'documents', path: '/owner/documents', icon: FolderOpen },
]

const secondaryItems = [
  { key: 'tax', path: '/owner/tax', icon: Calculator },
  { key: 'myProfile', path: '/owner/profile', icon: UserCircle },
]

function OwnerNavLinks() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('nav')

  const renderItem = (item: typeof primaryItems[0]) => {
    const href = `/${locale}${item.path}`
    const isActive =
      item.path === '/owner'
        ? pathname === `/${locale}/owner`
        : pathname.startsWith(href)
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
        {t(item.key as Parameters<typeof t>[0])}
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

export function OwnerSidebar() {
  return (
    <aside className="hidden md:flex h-full w-64 flex-col bg-card border-r border-border">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ImmoManage" className="h-9 w-auto" />
      </div>
      <OwnerNavLinks />
    </aside>
  )
}

export function OwnerMobileNav() {
  return (
    <MobileNavTrigger>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ImmoManage" className="h-9 w-auto" />
      </div>
      <OwnerNavLinks />
    </MobileNavTrigger>
  )
}
