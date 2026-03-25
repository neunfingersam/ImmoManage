import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isOllamaAvailable, generateText } from '@/lib/agent/ollama'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId || session.user.role === 'MIETER') {
    return new Response('Nicht autorisiert', { status: 401 })
  }

  const companyId = session.user.companyId

  if (!(await isOllamaAvailable())) {
    return new Response(JSON.stringify({ error: 'KI nicht verfügbar' }), { status: 503 })
  }

  const now = new Date()
  const in90days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  const leases = await prisma.lease.findMany({
    where: {
      companyId,
      status: 'ACTIVE',
      endDate: { lte: in90days },
    },
    include: {
      tenant: { select: { name: true } },
      unit: { include: { property: { select: { name: true } } } },
    },
    orderBy: { endDate: 'asc' },
  })

  if (leases.length === 0) {
    return Response.json({ summary: 'Keine Mietverträge laufen in den nächsten 90 Tagen ab.' })
  }

  const leaseList = leases.map(l => {
    const days = Math.ceil((new Date(l.endDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return `- ${l.tenant.name}, ${l.unit.property.name} ${l.unit.unitNumber} — läuft ab in ${days} Tagen (${new Date(l.endDate!).toLocaleDateString('de-DE')})`
  }).join('\n')

  const summary = await generateText([
    {
      role: 'system',
      content: 'Du bist ein Assistent für Immobilienverwaltung. Erstelle eine kurze Zusammenfassung der bald ablaufenden Mietverträge und empfehle Maßnahmen. Auf Deutsch, maximal 4 Sätze.',
    },
    {
      role: 'user',
      content: `Bald ablaufende Mietverträge:\n${leaseList}`,
    },
  ])

  return Response.json({ summary: summary.trim(), count: leases.length })
}
