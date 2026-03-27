// components/layout/SuperAdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { BarChart3, Building, UserCog, ScrollText, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileNavTrigger } from './MobileNav'

const navItems = [
  { key: 'overview', path: '/superadmin', icon: BarChart3 },
  { key: 'companies', path: '/superadmin/companies', icon: Building },
  { key: 'admins', path: '/superadmin/admins', icon: UserCog },
  { key: 'stats', path: '/superadmin/stats', icon: BarChart3 },
  { key: 'logs', path: '/superadmin/logs', icon: ScrollText },
]

function SuperAdminNavLinks() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('nav')

  return (
    <>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-serif text-base text-foreground leading-tight">ImmoManage</p>
          <p className="text-xs text-primary font-medium">{t('platformAdmin')}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const href = `/${locale}${item.path}`
          const isActive =
            item.path === '/superadmin'
              ? pathname === `/${locale}/superadmin`
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
        })}
      </nav>
    </>
  )
}

export function SuperAdminSidebar() {
  return (
    <aside className="hidden md:flex h-full w-64 flex-col bg-card border-r border-border">
      <SuperAdminNavLinks />
    </aside>
  )
}

export function SuperAdminMobileNav() {
  return (
    <MobileNavTrigger>
      <SuperAdminNavLinks />
    </MobileNavTrigger>
  )
}
