// components/layout/SuperAdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { BarChart3, Building, UserCog, ScrollText, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Übersicht', path: '/superadmin', icon: BarChart3 },
  { label: 'Unternehmen', path: '/superadmin/companies', icon: Building },
  { label: 'Admins', path: '/superadmin/admins', icon: UserCog },
  { label: 'Statistiken', path: '/superadmin/stats', icon: BarChart3 },
  { label: 'Aktivitäts-Log', path: '/superadmin/logs', icon: ScrollText },
]

export function SuperAdminSidebar() {
  const pathname = usePathname()
  const locale = useLocale()

  return (
    <aside className="flex h-full w-64 flex-col bg-card border-r border-border">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-serif text-base text-foreground leading-tight">ImmoManage</p>
          <p className="text-xs text-primary font-medium">Plattform-Admin</p>
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
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
