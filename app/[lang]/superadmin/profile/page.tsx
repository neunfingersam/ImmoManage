import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { PushToggle } from '@/components/layout/PushToggle'
import { getTranslations } from 'next-intl/server'

export default async function SuperAdminProfilePage() {
  const [session, t] = await Promise.all([
    getServerSession(authOptions),
    getTranslations('nav'),
  ])
  if (!session?.user?.id) redirect('/auth/login')

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('myProfile')}</h1>
      </div>
      <Card className="p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="font-medium text-foreground">{session.user.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">E-Mail</p>
          <p className="font-medium text-foreground">{session.user.email}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Rolle</p>
          <p className="font-medium text-foreground">Platform-Admin</p>
        </div>
      </Card>
      <PushToggle />
    </div>
  )
}
