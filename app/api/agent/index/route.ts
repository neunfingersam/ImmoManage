// app/api/agent/index/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractText, chunkText } from '@/lib/agent/extract'
import { getEmbedding, isOllamaAvailable } from '@/lib/agent/ollama'
import { addChunks } from '@/lib/agent/vectra'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId)
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { documentId } = await req.json()
  if (!documentId)
    return NextResponse.json({ error: 'documentId fehlt' }, { status: 400 })

  const doc = await prisma.document.findFirst({
    where: { id: documentId, companyId: session.user.companyId },
  })
  if (!doc)
    return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 })

  if (!(await isOllamaAvailable())) {
    return NextResponse.json({ error: 'Ollama nicht erreichbar' }, { status: 503 })
  }

  try {
    const text = await extractText(doc.fileUrl, doc.fileType)
    if (!text.trim()) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { indexed: true, extractedText: '' },
      })
      return NextResponse.json({ ok: true, chunks: 0 })
    }

    const chunks = chunkText(text)
    const embeddings = await Promise.all(chunks.map((c) => getEmbedding(c)))

    await addChunks(
      chunks.map((chunkText, i) => ({
        text: chunkText,
        vector: embeddings[i],
        metadata: {
          companyId: doc.companyId,
          documentId: doc.id,
          scope: doc.scope,
          tenantId: doc.tenantId ?? '',
          propertyId: doc.propertyId ?? '',
          text: chunkText,
        },
      }))
    )

    await prisma.document.update({
      where: { id: doc.id },
      data: { indexed: true, extractedText: text.slice(0, 10000) },
    })

    return NextResponse.json({ ok: true, chunks: chunks.length })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
