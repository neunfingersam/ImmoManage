'use client'

import { signOut } from 'next-auth/react'
import { useLocale } from 'next-intl'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const locale = useLocale()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}
      title="Abmelden"
    >
      <LogOut className="h-4 w-4 text-muted-foreground" />
    </Button>
  )
}
