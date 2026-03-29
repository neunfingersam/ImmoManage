import { notFound } from 'next/navigation'
import { getWegProperty } from '../../../_actions'
import { OwnerForm } from '@/components/weg/OwnerForm'

export default async function NewOwnerPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params
  const property = await getWegProperty(propertyId)
  if (!property) notFound()

  const totalWertquote = property.owners.reduce((s: number, o: { wertquote: number }) => s + o.wertquote, 0)
  const availableUnits = (property.units as Array<{ id: string; unitNumber: string; floor: number | null; owners: { id: string }[] }>).filter((u) => !u.owners || u.owners.length === 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Eigentümer hinzufügen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{property.name}</p>
      </div>
      <OwnerForm
        propertyId={propertyId}
        units={availableUnits}
        currentTotalWertquote={totalWertquote}
        mode="create"
      />
    </div>
  )
}
