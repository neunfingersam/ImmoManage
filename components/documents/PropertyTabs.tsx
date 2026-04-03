'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

type Option = { id: string; name: string }

export function PropertyTabs({ properties }: { properties: Option[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('propertyId')

  function select(id: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (id) {
      params.set('propertyId', id)
    } else {
      params.delete('propertyId')
    }
    params.delete('section')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-1 flex-wrap border-b border-border pb-3">
      <button
        onClick={() => select(null)}
        className={cn(
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          !current
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        Alle
      </button>
      {properties.map(p => (
        <button
          key={p.id}
          onClick={() => select(p.id)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            current === p.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {p.name}
        </button>
      ))}
    </div>
  )
}
