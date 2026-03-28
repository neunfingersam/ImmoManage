import { getDeletionRequests } from '@/lib/account-deletion-actions'
import { DeletionRequestsClient } from '@/app/[lang]/dashboard/deletion-requests/DeletionRequestsClient'

export default async function SuperAdminDeletionRequestsPage() {
  const requests = await getDeletionRequests()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Löschanträge</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Löschanträge von Admins, die ihren Account und ihre Company löschen möchten.
        </p>
      </div>
      <DeletionRequestsClient requests={requests} />
    </div>
  )
}
