// lib/agent/ollama.ts
// Ollama-Client Helper

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'

// ngrok adds a browser-warning page on free plans — skip it for API calls
const NGROK_HEADERS: Record<string, string> = OLLAMA_BASE.includes('ngrok')
  ? { 'ngrok-skip-browser-warning': 'true' }
  : {}

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      headers: NGROK_HEADERS,
      signal: AbortSignal.timeout(2000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_BASE}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
    body: JSON.stringify({ model: 'nomic-embed-text', input: text }),
  })
  if (!res.ok) throw new Error('Ollama Embedding fehlgeschlagen')
  const data = await res.json()
  // New API returns { embeddings: [[...]] }, old returned { embedding: [...] }
  return data.embeddings?.[0] ?? data.embedding
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function generateText(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL ?? 'llama3.2:1b',
      messages,
      stream: false,
    }),
  })
  if (!res.ok) throw new Error('Ollama nicht erreichbar')
  const data = await res.json()
  return data.message?.content ?? ''
}

export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL ?? 'llama3.2:1b',
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
