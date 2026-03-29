import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { getWegProperty } from '../../_actions'
import { WegSettingsForm } from './WegSettingsForm'

export default async function WegSettingsPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params
  const property = await getWegProperty(propertyId)
  if (!property) notFound()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/dashboard/weg" className="hover:text-foreground">WEG</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/dashboard/weg/${propertyId}`} className="hover:text-foreground">{property.name}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Einstellungen</span>
        </div>
        <h1 className="font-serif text-2xl text-foreground">WEG-Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{property.name}</p>
      </div>

      <Card className="p-6">
        <WegSettingsForm
          propertyId={propertyId}
          initial={{
            kanton: property.wegConfig?.kanton,
            gebVersicherungswert: property.wegConfig?.gebVersicherungswert,
            fondsBeitragssatz: property.wegConfig?.fondsBeitragssatz,
            fondsObergrenze: property.wegConfig?.fondsObergrenze,
            fondsStand: property.wegConfig?.fondsStand,
          }}
        />
      </Card>
    </div>
  )
}
