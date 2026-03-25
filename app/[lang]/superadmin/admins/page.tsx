import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { getAdmins, toggleAdminActive } from './_actions'

export default async function AdminsPage() {
  const admins = await getAdmins()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Admins</h1>
          <p className="text-sm text-muted-foreground mt-1">{admins.length} registriert</p>
        </div>
        <Button render={<Link href="/superadmin/admins/new" />} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />Neuer Admin
        </Button>
      </div>

      {admins.length === 0 ? (
        <EmptyState icon={<Users className="h-7 w-7" />} titel="Keine Admins" beschreibung="Noch kein Admin angelegt." />
      ) : (
        <div className="space-y-3">
          {admins.map(a => {
            async function handleToggle() {
              'use server'
              await toggleAdminActive(a.id)
            }
            return (
              <Card key={a.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground">{a.name}</p>
                    <Badge variant="outline">Admin</Badge>
                    {!a.active && <Badge variant="secondary">Inaktiv</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.email} · {a.company?.name ?? <span className="text-destructive">Kein Unternehmen</span>}
                  </p>
                </div>
                <form action={handleToggle}>
                  <Button type="submit" variant="outline" size="sm">
                    {a.active ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                </form>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
