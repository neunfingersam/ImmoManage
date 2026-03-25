// app/tenant/assistant/loading.tsx
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export default function AssistantLoading() {
  return (
    <div className="space-y-3">
      <LoadingSkeleton className="h-8 w-48" />
      <LoadingSkeleton className="h-64 rounded-card" />
    </div>
  )
}
