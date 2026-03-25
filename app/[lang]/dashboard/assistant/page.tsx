'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

type Message = { role: 'user' | 'agent'; content: string }

export default function DashboardAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/agent/admin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, messages }),
      })

      if (res.status === 503) {
        setUnavailable(true)
        setMessages(prev => [...prev, { role: 'agent', content: 'KI-Assistent ist momentan nicht verfügbar. Bitte stelle sicher dass Ollama läuft.' }])
        setLoading(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let agentText = ''
      let msgAdded = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n').filter(l => l.startsWith('data: '))) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.token) {
              agentText += data.token
              if (!msgAdded) {
                setMessages(prev => [...prev, { role: 'agent', content: agentText }])
                msgAdded = true
              } else {
                setMessages(prev => [...prev.slice(0, -1), { role: 'agent', content: agentText }])
              }
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'agent', content: 'Fehler beim Senden. Bitte versuche es erneut.' }])
    }
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div>
        <h1 className="font-serif text-2xl text-foreground">KI-Assistent</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fragen zu Mietern, Immobilien, Mietverträgen und Schadensmeldungen
        </p>
      </div>

      {unavailable && (
        <Card className="p-3 flex items-center gap-2 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">KI-Assistent momentan nicht verfügbar.</p>
        </Card>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 py-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-card bg-secondary text-primary">
              <Bot className="h-7 w-7" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Frag mich alles über deine Verwaltung — Mieter, Immobilien, offene Tickets oder Mietverträge.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              m.role === 'user' ? 'bg-primary text-white' : 'bg-secondary text-foreground'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start">
            <div className="bg-secondary rounded-2xl px-4 py-3 text-sm text-muted-foreground animate-pulse">
              Denkt nach…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Frage stellen…"
          rows={2}
          className="flex-1 resize-none"
          disabled={loading}
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="sm" className="bg-primary hover:bg-primary/90 shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
