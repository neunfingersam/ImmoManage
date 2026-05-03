import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isOllamaAvailable, generateText } from '@/lib/agent/ollama'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId || session.user.role === 'MIETER') {
    return new Response('Nicht autorisiert', { status: 401 })
  }

  const { id } = await params
  const doc = await prisma.document.findUnique({
    where: { id, companyId: session.user.companyId },
    select: { name: true, category: true },
  })

  if (!doc) return new Response('Nicht gefunden', { status: 404 })

  if (!(await isOllamaAvailable())) {
    return new Response(JSON.stringify({ error: 'KI nicht verfügbar' }), { status: 503 })
  }

  const summary = await generateText([
    {
      role: 'system',
      content: 'Du bist ein Assistent für Immobilienverwaltung. Erstelle eine kurze Zusammenfassung (2-3 Sätze) des Dokuments basierend auf Name und Kategorie. Auf Deutsch.',
    },
    {
      role: 'user',
      content: `Dokument: "${doc.name}" (Kategorie: ${doc.category}). Erstelle eine kurze Zusammenfassung was dieses Dokument typischerweise enthält.`,
    },
  ])

  return Response.json({ summary: summary.trim() })
}
