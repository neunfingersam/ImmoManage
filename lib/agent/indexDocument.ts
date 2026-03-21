// lib/agent/indexDocument.ts
import { prisma } from '@/lib/prisma'
import { extractText, chunkText } from './extract'
import { getEmbedding, isOllamaAvailable } from './ollama'
import { addChunks } from './vectra'

export async function indexDocument(documentId: string): Promise<void> {
  const doc = await prisma.document.findUnique({ where: { id: documentId } })
  if (!doc) return
  if (!(await isOllamaAvailable())) return

  try {
    const text = await extractText(doc.fileUrl, doc.fileType)
    if (!text.trim()) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { indexed: true, extractedText: '' },
      })
      return
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
  } catch {
    // Silently fail - indexing is best-effort
  }
}
