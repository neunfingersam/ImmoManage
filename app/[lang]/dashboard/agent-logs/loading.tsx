// app/dashboard/agent-logs/loading.tsx
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export default function AgentLogsLoading() {
  return (
    <div className="space-y-3">
      <LoadingSkeleton className="h-8 w-48" />
      <LoadingSkeleton count={5} className="h-16 rounded-card" />
    </div>
  )
}
