import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isOllamaAvailable, generateText } from '@/lib/agent/ollama'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role === 'MIETER') {
    return new Response('Nicht autorisiert', { status: 401 })
  }

  const { conversationContext, lastMessage } = await req.json()
  if (!lastMessage) return new Response('Nachricht fehlt', { status: 400 })

  if (!(await isOllamaAvailable())) {
    return new Response(JSON.stringify({ error: 'KI nicht verfügbar' }), { status: 503 })
  }

  const reply = await generateText([
    {
      role: 'system',
      content: 'Du bist ein professioneller Immobilienverwalter. Formuliere eine höfliche, kurze Antwort auf die Mieter-Nachricht. Schreibe nur die Antwort, ohne Begrüßungsformel oder Signatur. Auf Deutsch.',
    },
    {
      role: 'user',
      content: `${conversationContext ? `Gesprächsverlauf:\n${conversationContext}\n\n` : ''}Letzte Nachricht des Mieters: ${lastMessage}`,
    },
  ])

  return Response.json({ suggestion: reply.trim() })
}
