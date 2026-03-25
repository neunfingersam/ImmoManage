import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export default function TenantsLoading() {
  return (
    <div className="space-y-6">
      <LoadingSkeleton className="h-8 w-36" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LoadingSkeleton count={6} className="h-40 rounded-card" />
      </div>
    </div>
  )
}
