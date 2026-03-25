import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCompany, toggleCompanyActive } from '../_actions'

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', VERMIETER: 'Vermieter', MIETER: 'Mieter',
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = await getCompany(id)
  if (!company) notFound()

  async function handleToggle() {
    'use server'
    await toggleCompanyActive(id)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button render={<Link href="/superadmin/companies" />} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />Zurück
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">{company.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Slug: {company.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={company.active ? 'default' : 'secondary'}>{company.active ? 'Aktiv' : 'Inaktiv'}</Badge>
          <form action={handleToggle}>
            <Button type="submit" variant="outline" size="sm">
              {company.active ? 'Deaktivieren' : 'Aktivieren'}
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Immobilien', value: company._count.properties },
          { label: 'Mietverträge', value: company._count.leases },
          { label: 'Tickets', value: company._count.tickets },
        ].map(s => (
          <Card key={s.label} className="p-3 sm:p-4 text-center">
            <p className="text-2xl font-serif text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Nutzer ({company.users.length})</h2>
        {company.users.map(u => (
          <Card key={u.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{u.name}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{roleLabels[u.role] ?? u.role}</Badge>
              {!u.active && <Badge variant="secondary">Inaktiv</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
