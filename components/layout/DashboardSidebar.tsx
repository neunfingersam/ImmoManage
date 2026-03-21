// components/layout/DashboardSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Role } from '@/lib/generated/prisma'
import { MobileNavTrigger } from './MobileNav'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  nichtFuerRollen?: Role[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Immobilien', href: '/dashboard/properties', icon: Building2 },
  { label: 'Mieter', href: '/dashboard/tenants', icon: Users },
  { label: 'Mietverträge', href: '/dashboard/leases', icon: FileText },
  { label: 'Schadensmeldungen', href: '/dashboard/tickets', icon: AlertCircle },
  { label: 'Dokumente', href: '/dashboard/documents', icon: FolderOpen },
  { label: 'Nachrichten', href: '/dashboard/messages', icon: MessageSquare },
  { label: 'Kalender', href: '/dashboard/calendar', icon: Calendar },
  { label: 'Abrechnungen', href: '/dashboard/billing', icon: Receipt },
  { label: 'Zählerstände', href: '/dashboard/meters', icon: Gauge },
  { label: 'Übergaben', href: '/dashboard/handovers', icon: ClipboardCheck },
  { label: 'KI-Verlauf', href: '/dashboard/agent-logs', icon: Bot },
  {
    label: 'Team',
    href: '/dashboard/team',
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
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
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
