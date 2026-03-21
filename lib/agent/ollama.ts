// lib/agent/ollama.ts
// Ollama-Client Helper

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

export async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
  })
  if (!res.ok) throw new Error('Ollama Embedding fehlgeschlagen')
  const data = await res.json()
  return data.embedding
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3',
      messages,
      stream: true,
    }),
  })
  if (!res.ok || !res.body) throw new Error('Ollama nicht erreichbar')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    for (const line of chunk.split('\n').filter(Boolean)) {
      try {
        const json = JSON.parse(line)
        if (json.message?.content) yield json.message.content
      } catch {
        // ignore parse errors
      }
    }
  }
}
