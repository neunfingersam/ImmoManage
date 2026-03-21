import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Role } from '@/lib/generated/prisma'

export default async function AdminsPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPER_ADMIN') redirect('/403')

  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    include: { company: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Admins</h1>
        <p className="text-sm text-muted-foreground mt-1">{admins.length} registriert</p>
      </div>
      {admins.length === 0 ? (
        <EmptyState icon={<Users className="h-7 w-7" />} titel="Keine Admins" beschreibung="Noch kein Admin angelegt." />
      ) : (
        <div className="space-y-3">
          {admins.map(a => (
            <Card key={a.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.email} · {a.company?.name ?? '—'}</p>
              </div>
              <Badge variant={a.active ? 'default' : 'secondary'}>{a.active ? 'Aktiv' : 'Inaktiv'}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
