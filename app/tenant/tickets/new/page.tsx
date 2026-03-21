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
        include: { property: { select: { id: true, name: true } } },
      },
    },
  })

  const options = leases.map(l => ({
    propertyId: l.unit.property.id,
    propertyName: l.unit.property.name,
    unitId: l.unit.id,
    unitNumber: l.unit.unitNumber,
  }))

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
