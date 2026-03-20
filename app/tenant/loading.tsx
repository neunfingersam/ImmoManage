// app/tenant/loading.tsx
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export default function TenantLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="h-4 w-36" />
      </div>
      <LoadingSkeleton className="h-64 w-full rounded-card" />
    </div>
  )
}
