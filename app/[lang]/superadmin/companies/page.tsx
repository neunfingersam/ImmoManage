import Link from 'next/link'
import { Building2, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { getCompanies } from './_actions'

export default async function CompaniesPage() {
  const companies = await getCompanies()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Companies</h1>
          <p className="text-sm text-muted-foreground mt-1">{companies.length} registriert</p>
        </div>
        <Button render={<Link href="/superadmin/companies/new" />} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />Neue Company
        </Button>
      </div>

      {companies.length === 0 ? (
        <EmptyState icon={<Building2 className="h-7 w-7" />} titel="Keine Companies" beschreibung="Noch keine Company angelegt." />
      ) : (
        <div className="space-y-3">
          {companies.map(c => (
            <Card key={c.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{c.name}</p>
                  <Badge variant={c.active ? 'default' : 'secondary'}>{c.active ? 'Aktiv' : 'Inaktiv'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c._count.users} Nutzer · {c._count.properties} Immobilien · {c._count.tickets} Tickets
                </p>
              </div>
              <Button render={<Link href={`/superadmin/companies/${c.id}`} />} variant="outline" size="sm">
                Details
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
