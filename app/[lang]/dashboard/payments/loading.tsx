import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export default function PaymentsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <LoadingSkeleton className="h-20 w-full rounded-xl" />
        <LoadingSkeleton className="h-20 w-full rounded-xl" />
      </div>
      <LoadingSkeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}
