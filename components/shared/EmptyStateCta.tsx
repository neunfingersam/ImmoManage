'use client'

import { Button } from '@/components/ui/button'

export function EmptyStateCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button className="mt-5 bg-primary hover:bg-primary/90" onClick={onClick}>
      {label}
    </Button>
  )
}
