// app/dashboard/properties/[propertyId]/edit/page.tsx
import { notFound } from 'next/navigation'
import { PropertyForm } from '@/components/properties/PropertyForm'
import { getProperty, updateProperty } from '../../_actions'
import type { PropertyFormValues } from '@/lib/schemas/property'

export default async function EditPropertyPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params
  const property = await getProperty(propertyId)
  if (!property) notFound()

  const defaultValues: Partial<PropertyFormValues> = {
    name: property.name,
    address: property.address,
    type: property.type as 'SINGLE' | 'MULTI',
    unitCount: property.unitCount,
    year: property.year ?? undefined,
    description: property.description ?? undefined,
  }

  async function update(data: PropertyFormValues) {
    'use server'
    return updateProperty(propertyId, data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Immobilie bearbeiten</h1>
        <p className="text-sm text-muted-foreground mt-1">{property.name}</p>
      </div>
      <PropertyForm
        defaultValues={defaultValues}
        action={update}
        submitLabel="Änderungen speichern"
        backHref={`/dashboard/properties/${propertyId}`}
      />
    </div>
  )
}
