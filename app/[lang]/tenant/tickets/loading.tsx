import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
export default function TenantTicketsLoading() {
  return (
    <div className="space-y-6">
      <LoadingSkeleton className="h-8 w-40" />
      <LoadingSkeleton count={4} className="h-16 rounded-card" />
    </div>
  )
}
