import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export default function TenantMessagesLoading() {
  return (
    <div className="space-y-3">
      <LoadingSkeleton className="h-8 w-40" />
      <LoadingSkeleton count={5} className="h-12 rounded-card" />
    </div>
  )
}
