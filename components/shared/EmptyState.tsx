'use client'

// components/shared/EmptyState.tsx
import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  titel: string
  beschreibung: string
  ctaLabel?: string
  ctaOnClick?: () => void
}

// Wiederverwendbarer Empty-State für Listenansichten
export function EmptyState({
  icon: Icon,
  titel,
  beschreibung,
  ctaLabel,
  ctaOnClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-card bg-secondary text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-serif text-xl text-foreground">{titel}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{beschreibung}</p>
      {ctaLabel && ctaOnClick && (
        <Button
          className="mt-5 bg-primary hover:bg-primary/90"
          onClick={ctaOnClick}
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
