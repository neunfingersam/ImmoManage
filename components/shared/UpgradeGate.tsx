import { Lock } from 'lucide-react'
import Link from 'next/link'

interface UpgradeGateProps {
  feature: string
  requiredPlan: 'Standard' | 'Pro' | 'Enterprise'
}

export function UpgradeGate({ feature, requiredPlan }: UpgradeGateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Lock className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="font-serif text-2xl text-foreground mb-2">{feature} nicht verfügbar</h2>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        Diese Funktion ist ab dem <strong>{requiredPlan}-Plan</strong> verfügbar.
        Kontaktieren Sie Ihren Administrator oder upgraden Sie Ihren Plan.
      </p>
      <Link
        href="/preise"
        className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
        style={{ backgroundColor: '#E8734A' }}
      >
        Pläne vergleichen →
      </Link>
    </div>
  )
}
