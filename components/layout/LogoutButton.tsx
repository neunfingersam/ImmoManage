'use client'

import { signOut } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const locale = useLocale()
  const t = useTranslations('nav')
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}
      title={t('logout')}
    >
      <LogOut className="h-4 w-4 text-muted-foreground" />
    </Button>
  )
}
