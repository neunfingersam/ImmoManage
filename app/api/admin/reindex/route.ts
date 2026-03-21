// app/api/admin/reindex/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { indexDocument } from '@/lib/agent/indexDocument'

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return new Response('Nicht autorisiert', { status: 401 })
  }

  const docs = await prisma.document.findMany({
    where: {
      fileType: { in: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
    },
    select: { id: true },
  })

  let success = 0
  let failed = 0
  for (const doc of docs) {
    try {
      await indexDocument(doc.id)
      success++
    } catch {
      failed++
    }
  }

  return Response.json({ success, failed, total: docs.length })
}
