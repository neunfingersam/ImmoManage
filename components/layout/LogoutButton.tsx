'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => signOut({ callbackUrl: '/auth/login' })}
      title="Abmelden"
    >
      <LogOut className="h-4 w-4 text-muted-foreground" />
    </Button>
  )
}
