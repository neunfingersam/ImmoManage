// app/superadmin/loading.tsx
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export default function SuperAdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <LoadingSkeleton className="h-8 w-56" />
        <LoadingSkeleton className="h-4 w-44" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-28 w-full rounded-card" />
        ))}
      </div>
    </div>
  )
}
