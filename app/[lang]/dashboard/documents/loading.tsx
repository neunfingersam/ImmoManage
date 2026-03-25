import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      <LoadingSkeleton className="h-8 w-40" />
      <LoadingSkeleton count={5} className="h-16 rounded-card" />
    </div>
  )
}
