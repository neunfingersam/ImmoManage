import Link from 'next/link'
import { Building2, Home } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Property } from '@/lib/generated/prisma'

type PropertyWithCount = Property & { _count: { units: number } }

export function PropertyCard({ property }: { property: PropertyWithCount }) {
  const typeLabel = property.type === 'MULTI' ? 'Mehrfamilienhaus' : 'Einzelimmobilie'
  const Icon = property.type === 'MULTI' ? Building2 : Home

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary shrink-0" />
          <span className="font-medium text-foreground">{property.name}</span>
        </div>
        <Badge variant="secondary" className="shrink-0">{typeLabel}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{property.address}</p>
      <p className="text-xs text-muted-foreground">{property._count.units} Einheit{property._count.units !== 1 ? 'en' : ''}</p>
      <div className="flex gap-2 mt-auto">
        <Button render={<Link href={`/dashboard/properties/${property.id}`} />} variant="outline" size="sm" className="flex-1">
          Details
        </Button>
        <Button render={<Link href={`/dashboard/properties/${property.id}/edit`} />} variant="outline" size="sm" className="flex-1">
          Bearbeiten
        </Button>
      </div>
    </Card>
  )
}
