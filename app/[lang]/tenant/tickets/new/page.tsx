import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NewTicketForm } from './NewTicketForm'
import { createTicket } from '../_actions'

export default async function NewTicketPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const leases = await prisma.lease.findMany({
    where: { tenantId: session.user.id, status: 'ACTIVE' },
    include: {
      unit: {
        include: { property: { select: { id: true, name: true, address: true } } },
      },
    },
  })

  const options = leases.map(l => {
    const unit = l.unit
    const floorLabel = unit.floor !== null && unit.floor !== undefined
      ? unit.floor === 0 ? ' (EG)' : ` (${unit.floor}. OG)`
      : ''
    return {
      propertyId: unit.property.id,
      propertyName: unit.property.address || unit.property.name,
      unitId: unit.id,
      unitNumber: `Whg. ${unit.unitNumber}${floorLabel}`,
    }
  })

  if (options.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Neue Schadensmeldung</h1>
        </div>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Kein aktiver Mietvertrag vorhanden.</p>
          <p className="text-sm text-muted-foreground mt-1">Bitte wenden Sie sich an Ihren Vermieter.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Neue Schadensmeldung</h1>
        <p className="text-sm text-muted-foreground mt-1">Meldung einreichen</p>
      </div>
      <NewTicketForm options={options} action={createTicket} />
    </div>
  )
}
