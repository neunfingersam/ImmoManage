// app/auth/login/loading.tsx
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-8">
        <LoadingSkeleton className="h-10 w-48" />
        <LoadingSkeleton className="h-6 w-64" />
        <div className="space-y-4">
          <LoadingSkeleton className="h-12 w-full" />
          <LoadingSkeleton className="h-12 w-full" />
          <LoadingSkeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
