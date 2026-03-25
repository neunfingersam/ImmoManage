'use client'

import { useTransition, useRef, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Send, Sparkles } from 'lucide-react'
import type { ActionResult } from '@/lib/action-result'
import type { Message } from '@/lib/generated/prisma'

type Props = {
  onSend: (data: { toId: string; text: string }) => Promise<ActionResult<Message>>
  toId: string
  lastMessage?: string
  conversationContext?: string
  showSuggest?: boolean
}

export function MessageInput({ onSend, toId, lastMessage, conversationContext, showSuggest }: Props) {
  const [pending, startTransition] = useTransition()
  const [suggesting, setSuggesting] = useState(false)
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

  async function suggestReply() {
    setSuggesting(true)
    try {
      const res = await fetch('/api/agent/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastMessage, conversationContext }),
      })
      if (res.ok) {
        const { suggestion } = await res.json()
        if (ref.current) ref.current.value = suggestion
      }
    } catch { /* ignore */ }
    setSuggesting(false)
  }

  return (
    <div className="space-y-2">
      {showSuggest && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={suggestReply}
            disabled={suggesting || !lastMessage}
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            {suggesting ? 'Generiere…' : 'KI-Antwortvorschlag'}
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <Textarea ref={ref} onKeyDown={handleKeyDown} placeholder="Nachricht schreiben…" rows={2} className="flex-1 resize-none" />
        <Button type="submit" disabled={pending} size="sm" className="bg-primary hover:bg-primary/90 shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
