'use client'

// components/layout/TenantSidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, AlertCircle, FolderOpen, MessageSquare, Bot, Building } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Meine Wohnung', href: '/tenant', icon: Home },
  { label: 'Schadensmeldungen', href: '/tenant/tickets', icon: AlertCircle },
  { label: 'Meine Dokumente', href: '/tenant/documents', icon: FolderOpen },
  { label: 'Nachrichten', href: '/tenant/messages', icon: MessageSquare },
  { label: 'KI-Assistent', href: '/tenant/assistant', icon: Bot },
]

export function TenantSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col bg-card border-r border-border">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary">
          <Building className="h-5 w-5 text-primary-foreground" />
        </div>
        <p className="font-serif text-base text-foreground">ImmoManage</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === '/tenant'
              ? pathname === '/tenant'
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
    </aside>
  )
}
