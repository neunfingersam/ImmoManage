import { getDeletionRequests } from '@/lib/account-deletion-actions'
import { getTranslations } from 'next-intl/server'
import { DeletionRequestsClient } from './DeletionRequestsClient'

export default async function DeletionRequestsPage() {
  const t = await getTranslations('deletion')
  const requests = await getDeletionRequests()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('adminTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('adminSubtitle')}</p>
      </div>
      <DeletionRequestsClient requests={requests} />
    </div>
  )
}
