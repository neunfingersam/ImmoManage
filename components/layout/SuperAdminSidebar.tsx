// components/layout/SuperAdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { LayoutDashboard, Building, UserCog, ScrollText, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileNavTrigger } from './MobileNav'

const navItems = [
  { key: 'overview', path: '/superadmin', icon: LayoutDashboard },
  { key: 'companies', path: '/superadmin/companies', icon: Building },
  { key: 'admins', path: '/superadmin/admins', icon: UserCog },
  { key: 'deletionRequests', path: '/superadmin/deletion-requests', icon: Trash2, badge: true },
  { key: 'logs', path: '/superadmin/logs', icon: ScrollText },
]

function SuperAdminNavLinks({ deletionCount }: { deletionCount: number }) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('nav')

  return (
    <>
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ImmoManage" className="h-9 w-auto" />
        <p className="text-xs text-primary font-medium">{t('platformAdmin')}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const href = `/${locale}${item.path}`
          const isActive =
            item.path === '/superadmin'
              ? pathname === `/${locale}/superadmin`
              : pathname.startsWith(href)
          const count = item.badge ? deletionCount : 0

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
              {count > 0 && (
                <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#E8734A' }}>
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

export function SuperAdminSidebar({ deletionCount = 0 }: { deletionCount?: number }) {
  return (
    <aside className="hidden md:flex h-full w-64 flex-col bg-card border-r border-border">
      <SuperAdminNavLinks deletionCount={deletionCount} />
    </aside>
  )
}

export function SuperAdminMobileNav({ deletionCount = 0 }: { deletionCount?: number }) {
  return (
    <MobileNavTrigger>
      <SuperAdminNavLinks deletionCount={deletionCount} />
    </MobileNavTrigger>
  )
}
