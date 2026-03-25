import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
export default function TicketDetailLoading() {
  return (
    <div className="space-y-6 max-w-3xl">
      <LoadingSkeleton className="h-8 w-24" />
      <LoadingSkeleton className="h-12 w-80" />
      <LoadingSkeleton className="h-32 rounded-card" />
      <LoadingSkeleton className="h-20 rounded-card" />
      <LoadingSkeleton count={3} className="h-20 rounded-card" />
    </div>
  )
}
