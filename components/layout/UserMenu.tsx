'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { LogOut, UserCircle, Bell, BellOff, ChevronDown } from 'lucide-react'
import { usePushSubscription } from '@/hooks/usePushSubscription'
import { cn } from '@/lib/utils'

interface UserMenuProps {
  userName: string
  userEmail: string
  roleLabel: string
  profilePath: string
}

export function UserMenu({ userName, userEmail, roleLabel, profilePath }: UserMenuProps) {
  const locale = useLocale()
  const t = useTranslations('nav')
  const tp = useTranslations('push')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { supported, subscribed, subscribe, unsubscribe } = usePushSubscription()

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handlePushToggle() {
    if (subscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium text-foreground leading-tight">{userName}</p>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>

          {/* Profile link */}
          <div className="py-1">
            <Link
              href={`/${locale}${profilePath}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              {t('myProfile')}
            </Link>

            {/* Push toggle */}
            {supported && (
              <button
                onClick={handlePushToggle}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                {subscribed
                  ? <BellOff className="h-4 w-4 text-muted-foreground" />
                  : <Bell className="h-4 w-4 text-muted-foreground" />
                }
                <span>{subscribed ? tp('disable') : tp('enable')}</span>
              </button>
            )}
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
