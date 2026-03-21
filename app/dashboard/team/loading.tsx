import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
export default function Loading() {
  return (
    <div className="space-y-3">
      <LoadingSkeleton className="h-8 w-32" />
      <LoadingSkeleton count={4} className="h-16 rounded-lg" />
    </div>
  )
}
