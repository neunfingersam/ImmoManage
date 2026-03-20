// components/shared/LoadingSkeleton.tsx
'use client'

import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  count?: number
}

// Pulsierendes Skeleton für Loading-States
export function LoadingSkeleton({ className, count = 1 }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse rounded bg-muted',
            className
          )}
        />
      ))}
    </>
  )
}
