'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { commentSchema, type CommentFormValues } from '@/lib/schemas/ticket'
import type { ActionResult } from '@/lib/action-result'
import type { TicketComment } from '@/lib/generated/prisma'

type Props = {
  onSubmit: (data: CommentFormValues) => Promise<ActionResult<TicketComment>>
}

export function TicketCommentForm({ onSubmit: submitAction }: Props) {
  const [pending, startTransition] = useTransition()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema) as any,
  })

  function onSubmit(data: unknown) {
    startTransition(async () => {
      const result = await submitAction(data as CommentFormValues)
      if (result.success) reset()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <Textarea {...register('text')} placeholder="Kommentar hinzufügen…" rows={3} />
      {errors.text && <p className="text-sm text-destructive">{errors.text.message as string}</p>}
      <Button type="submit" disabled={pending} size="sm" className="bg-primary hover:bg-primary/90">
        {pending ? 'Senden…' : 'Kommentieren'}
      </Button>
    </form>
  )
}
