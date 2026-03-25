import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export default function PropertyDetailLoading() {
  return (
    <div className="space-y-6">
      <LoadingSkeleton className="h-8 w-24" />
      <LoadingSkeleton className="h-10 w-64" />
      <LoadingSkeleton className="h-32 rounded-card" />
      <LoadingSkeleton className="h-48 rounded-card" />
    </div>
  )
}
