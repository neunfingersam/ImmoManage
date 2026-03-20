import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export default function LeasesLoading() {
  return (
    <div className="space-y-6">
      <LoadingSkeleton className="h-8 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LoadingSkeleton count={4} className="h-36 rounded-card" />
      </div>
    </div>
  )
}
