// app/dashboard/properties/page.tsx
import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { getProperties } from './_actions'

export default async function PropertiesPage() {
  const properties = await getProperties()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Immobilien</h1>
          <p className="text-sm text-muted-foreground mt-1">{properties.length} Immobilie{properties.length !== 1 ? 'n' : ''}</p>
        </div>
        <Button render={<Link href="/dashboard/properties/new" />} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />
          Neu
        </Button>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          titel="Noch keine Immobilien"
          beschreibung="Legen Sie Ihre erste Immobilie an."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  )
}
