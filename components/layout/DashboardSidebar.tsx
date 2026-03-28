// components/layout/DashboardSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  AlertCircle,
  FolderOpen,
  MessageSquare,
  Calendar,
  CreditCard,
  Bot,
  UserCog,
  Receipt,
  Rocket,
  Calculator,
  Home,
  Trash2,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Role } from '@/lib/generated/prisma'
import { MobileNavTrigger } from './MobileNav'

interface NavItem {
  key: string
  path: string
  icon: React.ElementType
  rolesOnly?: Role[]
  featureGate?: 'taxFolder' | 'aiAssistant'
}

const sections: { items: NavItem[] }[] = [
  {
    items: [
      { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
      { key: 'properties', path: '/dashboard/properties', icon: Building2 },
      { key: 'tenants', path: '/dashboard/tenants', icon: Users },
      { key: 'owners', path: '/dashboard/owners', icon: Home },
      { key: 'leases', path: '/dashboard/leases', icon: FileText },
      { key: 'payments', path: '/dashboard/payments', icon: CreditCard },
    ],
  },
  {
    items: [
      { key: 'tickets', path: '/dashboard/tickets', icon: AlertCircle },
      { key: 'messages', path: '/dashboard/messages', icon: MessageSquare },
      { key: 'calendar', path: '/dashboard/calendar', icon: Calendar },
      { key: 'documents', path: '/dashboard/documents', icon: FolderOpen },
    ],
  },
  {
    items: [
      { key: 'tax', path: '/dashboard/tax', icon: Calculator, featureGate: 'taxFolder' },
      { key: 'billing', path: '/dashboard/billing', icon: Receipt },
      { key: 'templates', path: '/dashboard/templates', icon: FileText },
      { key: 'deletionRequests', path: '/dashboard/deletion-requests', icon: Trash2, rolesOnly: ['ADMIN', 'VERMIETER'] },
      { key: 'team', path: '/dashboard/team', icon: UserCog, rolesOnly: ['ADMIN'] },
      { key: 'abo', path: '/dashboard/abo', icon: CreditCard, rolesOnly: ['ADMIN'] },
      { key: 'assistant', path: '/dashboard/assistant', icon: Bot, featureGate: 'aiAssistant' },
      { key: 'onboarding', path: '/dashboard/onboarding/import', icon: Rocket },
    ],
  },
]

interface PlanFeatures {
  qrInvoice: boolean
  taxFolder: boolean
  aiAssistant: boolean
}

interface DashboardSidebarProps {
  role: Role
  companyName?: string
  planFeatures?: PlanFeatures
}

function DashboardNavLinks({ role, companyName, planFeatures }: DashboardSidebarProps) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('nav')

  function isLocked(item: NavItem): boolean {
    if (!item.featureGate || !planFeatures) return false
    return !planFeatures[item.featureGate]
  }

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ImmoManage" className="h-9 w-auto" />
        {companyName && (
          <p className="text-xs text-muted-foreground truncate max-w-[130px]">{companyName}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {sections.map((section, si) => {
          const visible = section.items.filter(
            (item) => !item.rolesOnly || item.rolesOnly.includes(role)
          )
          if (visible.length === 0) return null
          return (
            <div key={si}>
              {si > 0 && <div className="border-t border-border mb-4" />}
              <div className="space-y-0.5">
                {visible.map((item) => {
                  const locked = isLocked(item)
                  const href = `/${locale}${item.path}`
                  const isActive =
                    !locked &&
                    (item.path === '/dashboard'
                      ? pathname === `/${locale}/dashboard`
                      : pathname.startsWith(href))

                  if (locked) {
                    return (
                      <div
                        key={item.path}
                        title="Upgrade erforderlich"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium cursor-not-allowed select-none opacity-40"
                      >
                        <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                        <span className="flex-1">{t(item.key as Parameters<typeof t>[0])}</span>
                        <Lock className="h-3 w-3 flex-shrink-0" />
                      </div>
                    )
                  }

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
              </div>
            </div>
          )
        })}
      </nav>
    </>
  )
}

export function DashboardSidebar({ role, companyName, planFeatures }: DashboardSidebarProps) {
  return (
    <aside className="hidden md:flex h-full w-64 flex-col bg-card border-r border-border">
      <DashboardNavLinks role={role} companyName={companyName} planFeatures={planFeatures} />
    </aside>
  )
}

export function DashboardMobileNav({ role, companyName, planFeatures }: DashboardSidebarProps) {
  return (
    <MobileNavTrigger>
      <DashboardNavLinks role={role} companyName={companyName} planFeatures={planFeatures} />
    </MobileNavTrigger>
  )
}
