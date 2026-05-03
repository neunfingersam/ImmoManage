import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId || session.user.role === 'MIETER') {
    return new Response('Nicht autorisiert', { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'KI nicht verfügbar' }), { status: 503 })
  }

  const { id } = await params
  const doc = await prisma.document.findUnique({
    where: { id, companyId: session.user.companyId },
    select: { name: true, category: true, extractedText: true },
  })

  if (!doc) return new Response('Nicht gefunden', { status: 404 })

  const client = new Anthropic()
  const userContent = doc.extractedText?.trim()
    ? `Dokument: "${doc.name}" (Kategorie: ${doc.category})\n\nInhalt:\n${doc.extractedText.slice(0, 3000)}`
    : `Dokument: "${doc.name}" (Kategorie: ${doc.category}). Erstelle eine kurze Zusammenfassung was dieses Dokument typischerweise enthält.`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: 'Du bist ein Assistent für Immobilienverwaltung. Erstelle eine kurze Zusammenfassung (2-3 Sätze) des Dokuments. Auf Deutsch.',
    messages: [{ role: 'user', content: userContent }],
  })

  const summary = message.content[0].type === 'text' ? message.content[0].text : ''
  return Response.json({ summary: summary.trim() })
}
