// components/shared/EmptyState.tsx
import { type ReactNode } from 'react'
import { EmptyStateCta } from './EmptyStateCta'

interface EmptyStateProps {
  icon: ReactNode
  titel: string
  beschreibung: string
  ctaLabel?: string
  ctaOnClick?: () => void
}

// Wiederverwendbarer Empty-State für Listenansichten
export function EmptyState({
  icon,
  titel,
  beschreibung,
  ctaLabel,
  ctaOnClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-card bg-secondary text-primary">
        {icon}
      </div>
      <h3 className="font-serif text-xl text-foreground">{titel}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{beschreibung}</p>
      {ctaLabel && ctaOnClick && (
        <EmptyStateCta label={ctaLabel} onClick={ctaOnClick} />
      )}
    </div>
  )
}
