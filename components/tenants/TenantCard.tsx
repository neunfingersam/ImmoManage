'use client'

import { useTransition } from 'react'
import { Mail, Phone, UserX } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { deactivateTenant } from '@/app/dashboard/tenants/_actions'
import type { User } from '@/lib/generated/prisma'

export function TenantCard({ tenant }: { tenant: User }) {
  const [pending, startTransition] = useTransition()
  const initials = tenant.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  function handleDeactivate() {
    if (!confirm(`Mieter "${tenant.name}" wirklich deaktivieren?`)) return
    startTransition(async () => {
      await deactivateTenant(tenant.id)
    })
  }

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback className="bg-secondary text-foreground">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{tenant.name}</p>
          {!tenant.active && <Badge variant="destructive" className="text-xs">Inaktiv</Badge>}
        </div>
      </div>
      <div className="space-y-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{tenant.email}</span>
        </div>
        {tenant.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{tenant.phone}</span>
          </div>
        )}
      </div>
      {tenant.active && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeactivate}
          disabled={pending}
          className="text-destructive hover:text-destructive self-start"
        >
          <UserX className="h-4 w-4 mr-1" />
          Deaktivieren
        </Button>
      )}
    </Card>
  )
}
