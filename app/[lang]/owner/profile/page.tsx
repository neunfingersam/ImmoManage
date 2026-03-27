import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/card'
import { getTranslations } from 'next-intl/server'
import { DeleteAccountSection } from '@/components/account/DeleteAccountSection'

export default async function OwnerProfilePage() {
  const session = await getServerSession(authOptions)
  const t = await getTranslations('owner')

  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          deletionRequest: { select: { status: true } },
        },
      })
    : null

  const alreadyRequested = !!user?.deletionRequest

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="font-serif text-2xl text-foreground">{t('myProfile')}</h1>
      <Card className="p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">{t('name')}</p>
          <p className="font-medium text-foreground">{session?.user?.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('email')}</p>
          <p className="font-medium text-foreground">{session?.user?.email}</p>
        </div>
      </Card>
      <DeleteAccountSection
        hasActiveLease={false}
        alreadyRequested={alreadyRequested}
      />
    </div>
  )
}
