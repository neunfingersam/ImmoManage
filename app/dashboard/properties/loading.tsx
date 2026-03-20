// app/dashboard/properties/loading.tsx
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export default function PropertiesLoading() {
  return (
    <div className="space-y-6">
      <LoadingSkeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LoadingSkeleton count={6} className="h-44 rounded-card" />
      </div>
    </div>
  )
}
