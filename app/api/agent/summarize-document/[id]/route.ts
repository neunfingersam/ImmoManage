import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isOllamaAvailable, generateText } from '@/lib/agent/ollama'

async function extractText(fileUrl: string, fileType: string): Promise<{ text: string | null; error?: string }> {
  try {
    const res = await fetch(fileUrl)
    if (!res.ok) return { text: null, error: `Fetch failed: ${res.status}` }
    const buffer = Buffer.from(await res.arrayBuffer())

    if (fileType === 'application/pdf' || fileUrl.endsWith('.pdf')) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse')
      const data = await pdfParse(buffer)
      return { text: (data.text as string).slice(0, 4000).trim() || null }
    }

    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileUrl.endsWith('.docx')
    ) {
      const mammoth = await import('mammoth')
      const { value } = await mammoth.extractRawText({ buffer })
      return { text: value.slice(0, 4000).trim() || null }
    }

    return { text: null }
  } catch (e) {
    return { text: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId || session.user.role === 'MIETER') {
    return new Response('Nicht autorisiert', { status: 401 })
  }

  const { id } = await params
  const doc = await prisma.document.findUnique({
    where: { id, companyId: session.user.companyId },
    select: { name: true, category: true, fileUrl: true, fileType: true },
  })

  if (!doc) return new Response('Nicht gefunden', { status: 404 })

  if (!(await isOllamaAvailable())) {
    return new Response(JSON.stringify({ error: 'KI nicht verfügbar' }), { status: 503 })
  }

  const { text: extractedText, error: extractError } = await extractText(doc.fileUrl, doc.fileType)

  const userMessage = extractedText
    ? `Dokument: "${doc.name}" (Kategorie: ${doc.category})\n\nInhalt:\n${extractedText}\n\nErstelle eine kurze Zusammenfassung (2-3 Sätze) des tatsächlichen Inhalts.`
    : `Dokument: "${doc.name}" (Kategorie: ${doc.category}). Erstelle eine kurze Zusammenfassung was dieses Dokument typischerweise enthält.`

  console.log('[summarize]', { docId: id, extractedText: !!extractedText, extractError })

  const summary = await generateText([
    {
      role: 'system',
      content: 'Du bist ein Assistent für Immobilienverwaltung. Antworte auf Deutsch, präzise und kurz.',
    },
    {
      role: 'user',
      content: userMessage,
    },
  ])

  return Response.json({ summary: summary.trim() })
}
