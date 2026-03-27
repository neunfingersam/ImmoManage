import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTenant, getUnitsForMove } from '../_actions'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TenantEditForm } from './TenantEditForm'
import { MoveUnitDialog } from './MoveUnitDialog'
import { ResendInviteButton } from './ResendInviteButton'

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const [tenant, unitsForMove] = await Promise.all([
    getTenant(id),
    getUnitsForMove(id),
  ])

  if (!tenant) notFound()

  const activeLease = await prisma.lease.findFirst({
    where: { tenantId: id, status: 'ACTIVE' },
    include: {
      unit: { include: { property: { select: { name: true } } } },
    },
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/tenants"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
        <div>
          <h1 className="font-serif text-2xl text-foreground">{tenant.name}</h1>
          {!tenant.active && <Badge variant="destructive" className="text-xs">Inaktiv</Badge>}
        </div>
      </div>

      {activeLease && (
        <Card className="p-4 space-y-1 text-sm">
          <p className="font-medium text-foreground">Aktueller Mietvertrag</p>
          <p className="text-muted-foreground">
            {activeLease.unit.property.name} · Einheit {activeLease.unit.unitNumber}
          </p>
          <p className="text-muted-foreground">
            Warmmiete: {(activeLease.coldRent + activeLease.extraCosts).toFixed(2)} €/Monat
          </p>
          <p className="text-muted-foreground">
            Seit: {new Date(activeLease.startDate).toLocaleDateString('de-DE')}
          </p>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="font-medium text-foreground">Daten bearbeiten</h2>
        <TenantEditForm tenant={tenant} />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-foreground">Zugang</h2>
        <p className="text-sm text-muted-foreground">
          Eine neue Einladungsmail mit einem Link zum Passwort setzen an <strong>{tenant.email}</strong> senden. Gültig für 72 Stunden.
        </p>
        <ResendInviteButton tenantId={tenant.id} />
      </section>

      {activeLease && unitsForMove.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-medium text-foreground">Mieter umziehen</h2>
          <p className="text-sm text-muted-foreground">
            Der aktuelle Mietvertrag wird beendet und ein neuer in der gewählten Einheit angelegt.
          </p>
          <MoveUnitDialog
            tenantId={id}
            tenantName={tenant.name}
            options={unitsForMove}
          />
        </section>
      )}
    </div>
  )
}
