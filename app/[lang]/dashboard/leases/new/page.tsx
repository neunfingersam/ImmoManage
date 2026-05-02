import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LeaseForm } from '@/components/leases/LeaseForm'
import { createLease } from '../_actions'
import { getTranslations } from 'next-intl/server'

export default async function NewLeasePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const unitWhere = session.user.role === 'VERMIETER'
    ? { property: { companyId: session.user.companyId, assignments: { some: { userId: session.user.id } } } }
    : { property: { companyId: session.user.companyId } }

  const [t, units, tenants] = await Promise.all([
    getTranslations('leases'),
    prisma.unit.findMany({
      where: unitWhere,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { unitNumber: 'asc' },
    }),
    prisma.user.findMany({
      where: { role: 'MIETER', companyId: session.user.companyId, active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('newTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('newDesc')}</p>
      </div>
      <LeaseForm units={units as any} tenants={tenants} action={createLease} />
    </div>
  )
}
