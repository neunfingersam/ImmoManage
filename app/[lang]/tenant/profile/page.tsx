import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { DeleteAccountSection } from '@/components/account/DeleteAccountSection'
import { DataExportSection } from '@/components/account/DataExportSection'
import { getTranslations } from 'next-intl/server'

export default async function ProfilePage() {
  const [t, session] = await Promise.all([
    getTranslations('tenant'),
    getServerSession(authOptions),
  ])
  if (!session?.user?.id) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      whatsapp: true,
      leases: { where: { status: 'ACTIVE' }, select: { id: true } },
      deletionRequest: { select: { status: true } },
    },
  })
  if (!user) redirect('/auth/login')

  const hasActiveLease = user.leases.length > 0
  const alreadyRequested = !!user.deletionRequest

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('myProfile')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('profileSubtitle')}</p>
      </div>
      <ProfileForm
        defaultValues={{
          name: user.name,
          email: user.email,
          phone: user.phone ?? '',
          whatsapp: user.whatsapp ?? '',
        }}
      />
      <DataExportSection />
      <DeleteAccountSection
        hasActiveLease={hasActiveLease}
        alreadyRequested={alreadyRequested}
      />
    </div>
  )
}
