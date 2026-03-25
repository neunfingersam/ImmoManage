// components/layout/DashboardSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  AlertCircle,
  FolderOpen,
  MessageSquare,
  Calendar,
  Receipt,
  Bot,
  UserCog,
  Building,
  Gauge,
  ClipboardCheck,
  CreditCard,
  Rocket,
  CheckSquare,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Role } from '@/lib/generated/prisma'
import { MobileNavTrigger } from './MobileNav'

interface NavItem {
  label: string
  path: string // relative path without locale prefix
  icon: React.ElementType
  nichtFuerRollen?: Role[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Immobilien', path: '/dashboard/properties', icon: Building2 },
  { label: 'Mieter', path: '/dashboard/tenants', icon: Users },
  { label: 'Mietverträge', path: '/dashboard/leases', icon: FileText },
  { label: 'Schadensmeldungen', path: '/dashboard/tickets', icon: AlertCircle },
  { label: 'Dokumente', path: '/dashboard/documents', icon: FolderOpen },
  { label: 'Nachrichten', path: '/dashboard/messages', icon: MessageSquare },
  { label: 'Kalender', path: '/dashboard/calendar', icon: Calendar },
  { label: 'Zahlungen', path: '/dashboard/payments', icon: CreditCard },
  { label: 'Abrechnungen', path: '/dashboard/billing', icon: Receipt },
  { label: 'Zählerstände', path: '/dashboard/meters', icon: Gauge },
  { label: 'Übergaben', path: '/dashboard/handovers', icon: ClipboardCheck },
  { label: 'Aufgaben', path: '/dashboard/tasks', icon: CheckSquare },
  { label: 'Aktivitäten', path: '/dashboard/activity', icon: Clock },
  { label: 'Vorlagen', path: '/dashboard/templates', icon: FileText },
  { label: 'Einrichtung', path: '/dashboard/onboarding/import', icon: Rocket },
  { label: 'KI-Assistent', path: '/dashboard/assistant', icon: Bot },
  {
    label: 'Team',
    path: '/dashboard/team',
    icon: UserCog,
    nichtFuerRollen: ['VERMIETER'],
  },
]

interface DashboardSidebarProps {
  role: Role
  companyName?: string
}

function DashboardNavLinks({ role, companyName }: DashboardSidebarProps) {
  const pathname = usePathname()
  const locale = useLocale()

  const sichtbareItems = navItems.filter(
    (item) => !item.nichtFuerRollen?.includes(role)
  )

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary">
          <Building className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-serif text-base text-foreground leading-tight">ImmoManage</p>
          {companyName && (
            <p className="text-xs text-muted-foreground truncate max-w-[130px]">{companyName}</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {sichtbareItems.map((item) => {
          const href = `/${locale}${item.path}`
          const isActive =
            item.path === '/dashboard'
              ? pathname === `/${locale}/dashboard`
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
    </>
  )
}

export function DashboardSidebar({ role, companyName }: DashboardSidebarProps) {
  return (
    <aside className="hidden md:flex h-full w-64 flex-col bg-card border-r border-border">
      <DashboardNavLinks role={role} companyName={companyName} />
    </aside>
  )
}

export function DashboardMobileNav({ role, companyName }: DashboardSidebarProps) {
  return (
    <MobileNavTrigger>
      <DashboardNavLinks role={role} companyName={companyName} />
    </MobileNavTrigger>
  )
}
