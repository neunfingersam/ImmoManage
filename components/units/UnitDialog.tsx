'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { unitSchema, type UnitFormValues } from '@/lib/schemas/unit'
import { createUnit, updateUnit } from '@/app/[lang]/dashboard/properties/_actions'
import type { Unit } from '@/lib/generated/prisma'

type Props = {
  propertyId: string
  editUnit?: Unit | null
  onClose?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function UnitDialog({ propertyId, editUnit, onClose, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema) as any,
    defaultValues: editUnit
      ? {
          propertyId,
          unitNumber: editUnit.unitNumber,
          floor: editUnit.floor ?? undefined,
          size: editUnit.size ?? undefined,
          rooms: editUnit.rooms ?? undefined,
          persons: editUnit.persons ?? 1,
        }
      : { propertyId, persons: 1 },
  })

  function onSubmit(data: unknown) {
    const formData = data as UnitFormValues
    setServerError(null)
    startTransition(async () => {
      const result = editUnit
        ? await updateUnit(editUnit.id, formData)
        : await createUnit(formData)

      if (result.success) {
        reset({ propertyId })
        setOpen(false)
        onClose?.()
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90" size="sm" />}>
          <Plus className="h-4 w-4 mr-1" />
          Einheit hinzufügen
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editUnit ? 'Einheit bearbeiten' : 'Neue Einheit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <input type="hidden" {...register('propertyId')} />

          <div className="space-y-1">
            <Label htmlFor="unitNumber">Einheitsnummer</Label>
            <Input id="unitNumber" {...register('unitNumber')} placeholder="z.B. EG links" />
            {errors.unitNumber && <p className="text-sm text-destructive">{errors.unitNumber.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="floor">Etage</Label>
              <Input id="floor" type="number" {...register('floor')} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="size">Größe (m²)</Label>
              <Input id="size" type="number" step="0.1" {...register('size')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rooms">Zimmer</Label>
              <Input id="rooms" type="number" step="0.5" {...register('rooms')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="persons">Personenzahl</Label>
            <Input id="persons" type="number" min={1} {...register('persons')} placeholder="1" />
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
              {pending ? 'Speichern…' : editUnit ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
