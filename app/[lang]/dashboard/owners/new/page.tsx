import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import { NewOwnerForm } from './NewOwnerForm'

export default async function NewOwnerPage() {
  const session = await getServerSession(authOptions)
  const t = await getTranslations('owners')

  const properties = await prisma.property.findMany({
    where: { companyId: session!.user.companyId! },
    include: { units: { select: { id: true, unitNumber: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-serif text-2xl text-foreground">{t('addTitle')}</h1>
      <NewOwnerForm properties={properties} />
    </div>
  )
}
