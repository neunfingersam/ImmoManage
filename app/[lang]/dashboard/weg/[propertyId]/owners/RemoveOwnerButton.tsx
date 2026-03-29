'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { removeWegOwner } from '@/app/[lang]/dashboard/weg/_actions'

export function RemoveOwnerButton({ ownerId, propertyId, ownerName }: {
  ownerId: string
  propertyId: string
  ownerName: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleRemove() {
    if (!confirm(`${ownerName} wirklich entfernen? Der Benutzer-Account bleibt erhalten.`)) return
    startTransition(async () => {
      await removeWegOwner(ownerId, propertyId)
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
      onClick={handleRemove}
      disabled={isPending}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}
