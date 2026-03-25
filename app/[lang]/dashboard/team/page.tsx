import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { getTeamMembers, toggleUserActive } from './_actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

const roleLabels: Record<string, string> = { ADMIN: 'Admin', VERMIETER: 'Vermieter' }

export default async function TeamPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') redirect('/403')

  const members = await getTeamMembers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">{members.length} Mitglieder</p>
        </div>
        <Button render={<Link href="/dashboard/team/new" />} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />Vermieter hinzufügen
        </Button>
      </div>

      {members.length === 0 ? (
        <EmptyState icon={<Users className="h-7 w-7" />} titel="Kein Team" beschreibung="Noch kein Vermieter angelegt." />
      ) : (
        <div className="space-y-3">
          {members.map(m => {
            async function handleToggle() {
              'use server'
              await toggleUserActive(m.id)
            }
            return (
              <Card key={m.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{m.name}</p>
                    <Badge variant="outline">{roleLabels[m.role] ?? m.role}</Badge>
                    {!m.active && <Badge variant="secondary">Inaktiv</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.email}{m.phone ? ` · ${m.phone}` : ''}</p>
                </div>
                <form action={handleToggle}>
                  <Button type="submit" variant="outline" size="sm">
                    {m.active ? 'Deaktivieren' : 'Aktivieren'}
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
