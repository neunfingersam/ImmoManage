// lib/agent/vectra.ts
import { LocalIndex } from 'vectra'
import path from 'path'

const INDEX_PATH = path.join(process.cwd(), 'data', 'vectors')

let _index: LocalIndex | null = null

export async function getIndex(): Promise<LocalIndex> {
  if (!_index) {
    _index = new LocalIndex(INDEX_PATH)
    if (!(await _index.isIndexCreated())) {
      await _index.createIndex()
    }
  }
  return _index
}

export async function addChunks(
  chunks: { text: string; vector: number[]; metadata: Record<string, string> }[]
) {
  const index = await getIndex()
  for (const chunk of chunks) {
    await index.insertItem({ vector: chunk.vector, metadata: chunk.metadata })
  }
}

export async function queryChunks(
  vector: number[],
  filter: {
    companyId: string
    tenantId?: string
    propertyIds?: string[]
    role?: 'ADMIN' | 'VERMIETER'
  },
  topK = 5
) {
  const index = await getIndex()
  const results = await index.queryItems(vector, '', topK * 3)

  return results
    .filter((r) => {
      const m = r.item.metadata as Record<string, string>
      if (m.companyId !== filter.companyId) return false

      // Admin sieht alle Company-Dokumente
      if (filter.role === 'ADMIN') return true

      if (m.scope === 'TENANT') return m.tenantId === filter.tenantId
      if (m.scope === 'PROPERTY') return filter.propertyIds?.includes(m.propertyId ?? '') ?? false
      return true // GLOBAL
    })
    .slice(0, topK)
    .map((r) => ({
      text: (r.item.metadata as Record<string, string>).text,
      documentId: (r.item.metadata as Record<string, string>).documentId,
      score: r.score,
    }))
}
