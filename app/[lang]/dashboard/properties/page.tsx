import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { getProperties } from './_actions'
import { getTranslations } from 'next-intl/server'

export default async function PropertiesPage() {
  const [t, properties] = await Promise.all([
    getTranslations('properties'),
    getProperties(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('count', { count: properties.length })}</p>
        </div>
        <Button render={<Link href="/dashboard/properties/new" />} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />
          {t('newBtn')}
        </Button>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7" />}
          titel={t('empty')}
          beschreibung={t('emptyDesc')}
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
