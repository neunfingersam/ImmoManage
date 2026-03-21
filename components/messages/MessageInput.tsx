'use client'

import { useTransition, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import type { ActionResult } from '@/lib/action-result'
import type { Message } from '@/lib/generated/prisma'

type Props = {
  onSend: (data: { toId: string; text: string }) => Promise<ActionResult<Message>>
  toId: string
}

export function MessageInput({ onSend, toId }: Props) {
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = ref.current?.value.trim()
    if (!text) return
    startTransition(async () => {
      const result = await onSend({ toId, text })
      if (result.success && ref.current) ref.current.value = ''
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <Textarea ref={ref} onKeyDown={handleKeyDown} placeholder="Nachricht schreiben…" rows={2} className="flex-1 resize-none" />
      <Button type="submit" disabled={pending} size="sm" className="bg-primary hover:bg-primary/90 shrink-0">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
