import { getLocale } from 'next-intl/server'
// app/dashboard/properties/[propertyId]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UnitDialog } from '@/components/units/UnitDialog'
import { UnitsTable } from '@/components/units/UnitsTable'
import { getProperty, getVermieterForAssignment } from '../_actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PropertyAssignments } from './PropertyAssignments'

export default async function PropertyDetailPage({params }: { params: Promise<{ propertyId: string }> }) {
  const lang = await getLocale()
  const { propertyId } = await params
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.role === 'ADMIN'

  const [property, vermieterList] = await Promise.all([
    getProperty(propertyId),
    isAdmin ? getVermieterForAssignment() : Promise.resolve([]),
  ])
  if (!property) notFound()

  const typeLabel = property.type === 'MULTI' ? 'Mehrfamilienhaus' : 'Einzelimmobilie'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button render={<Link href={`/${lang}/dashboard/properties`} />} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">{property.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {property.address}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Badge variant="secondary">{typeLabel}</Badge>
          <Button render={<Link href={`/${lang}/dashboard/properties/${property.id}/edit`} />} variant="outline" size="sm">
            Bearbeiten
          </Button>
        </div>
      </div>

      {property.description && (
        <Card className="p-4 text-sm text-muted-foreground">{property.description}</Card>
      )}

      {isAdmin && (
        <section className="space-y-3">
          <h2 className="font-medium text-foreground">Zugewiesene Vermieter</h2>
          <PropertyAssignments
            propertyId={property.id}
            assigned={property.assignments.map(a => a.user)}
            available={vermieterList}
          />
        </section>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-foreground">Einheiten ({property.units.length})</h2>
          <UnitDialog propertyId={property.id} />
        </div>

        {property.units.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Noch keine Einheiten. Füge die erste Einheit hinzu.
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <UnitsTable units={property.units as any} propertyId={property.id} />
          </Card>
        )}
      </div>
    </div>
  )
}
