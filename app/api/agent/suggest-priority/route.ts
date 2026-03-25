import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isOllamaAvailable, generateText } from '@/lib/agent/ollama'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new Response('Nicht autorisiert', { status: 401 })

  const { title, description } = await req.json()
  if (!title) return new Response('Titel fehlt', { status: 400 })

  if (!(await isOllamaAvailable())) {
    return new Response(JSON.stringify({ error: 'KI nicht verfügbar' }), { status: 503 })
  }

  const reply = await generateText([
    {
      role: 'system',
      content: 'Du bist ein Assistent für Immobilienverwaltung. Antworte NUR mit einem einzigen Wort: LOW, MEDIUM oder HIGH. Keine Erklärung.',
    },
    {
      role: 'user',
      content: `Welche Priorität sollte folgende Schadensmeldung haben?\nTitel: ${title}\nBeschreibung: ${description ?? ''}`,
    },
  ])

  const raw = reply.trim().toUpperCase()
  const priority = ['LOW', 'MEDIUM', 'HIGH'].includes(raw) ? raw : 'MEDIUM'

  return Response.json({ priority })
}
