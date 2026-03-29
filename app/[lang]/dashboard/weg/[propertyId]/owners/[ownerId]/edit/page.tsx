import { notFound } from 'next/navigation'
import { getWegProperty } from '../../../../_actions'
import { OwnerForm } from '@/components/weg/OwnerForm'
import { ResetPasswordButton } from '@/components/shared/ResetPasswordButton'
import { Card } from '@/components/ui/card'

export default async function EditOwnerPage({ params }: { params: Promise<{ propertyId: string; ownerId: string }> }) {
  const { propertyId, ownerId } = await params
  const property = await getWegProperty(propertyId)
  if (!property) notFound()

  type OwnerEntry = {
    id: string; wertquote: number; unitId: string | null
    hypothekarbetrag: number | null; hypothekarzins: number | null
    bankverbindung: string | null; zahlungsIban: string | null
    user: { id: string; name: string; email: string; phone: string | null }
  }
  type UnitEntry = { id: string; unitNumber: string; floor: number | null; owners: { id: string }[] }
  const owner = (property.owners as OwnerEntry[]).find((o) => o.id === ownerId)
  if (!owner) notFound()

  // Total wertquote excluding this owner (for the form's live calculation)
  const otherTotal = (property.owners as OwnerEntry[])
    .filter((o) => o.id !== ownerId)
    .reduce((s: number, o) => s + o.wertquote, 0)

  // All units: already-assigned ones except this owner's own unit
  const availableUnits = (property.units as UnitEntry[]).filter(
    (u) => u.owners.length === 0 || u.id === owner.unitId
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Eigentümer bearbeiten</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{owner.user.name} · {property.name}</p>
      </div>
      <Card className="p-4">
        <p className="text-sm font-medium text-foreground mb-1">Zugang</p>
        <p className="text-xs text-muted-foreground mb-3">
          Passwort-Link per E-Mail an <strong>{owner.user.email}</strong> senden. Gültig für 1 Stunde.
        </p>
        <ResetPasswordButton userId={owner.user.id} />
      </Card>

      <OwnerForm
        propertyId={propertyId}
        units={availableUnits}
        currentTotalWertquote={otherTotal}
        mode="edit"
        ownerId={ownerId}
        initial={{
          name: owner.user.name,
          email: owner.user.email,
          phone: owner.user.phone ?? undefined,
          unitId: owner.unitId ?? undefined,
          wertquote: owner.wertquote,
          hypothekarbetrag: owner.hypothekarbetrag ?? undefined,
          hypothekarzins: owner.hypothekarzins ?? undefined,
          bankverbindung: owner.bankverbindung ?? undefined,
          zahlungsIban: owner.zahlungsIban ?? undefined,
        }}
      />
    </div>
  )
}
