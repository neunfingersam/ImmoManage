import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import HauswartEditForm from './form'

export default async function EditHauswartPage({ params }: {
  params: Promise<{ lang: string; propertyId: string; id: string }>
}) {
  const { lang, propertyId, id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) notFound()

  const entry = await prisma.hauswartEntry.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!entry) notFound()

  return <HauswartEditForm entry={entry} params={{ lang, propertyId, id }} />
}
