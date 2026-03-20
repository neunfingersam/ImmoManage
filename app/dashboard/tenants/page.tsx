import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TenantCard } from '@/components/tenants/TenantCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { getTenants } from './_actions'
import { Users } from 'lucide-react'

export default async function TenantsPage() {
  const tenants = await getTenants()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Mieter</h1>
          <p className="text-sm text-muted-foreground mt-1">{tenants.length} Mieter</p>
        </div>
        <Button render={<Link href="/dashboard/tenants/new" />} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />
          Neu
        </Button>
      </div>

      {tenants.length === 0 ? (
        <EmptyState icon={Users} titel="Noch keine Mieter" beschreibung="Legen Sie den ersten Mieter an." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((t) => (
            <TenantCard key={t.id} tenant={t} />
          ))}
        </div>
      )}
    </div>
  )
}
