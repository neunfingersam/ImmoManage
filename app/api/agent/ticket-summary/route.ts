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

  const tickets = await prisma.ticket.findMany({
    where: { companyId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    include: {
      tenant: { select: { name: true } },
      property: { select: { name: true } },
      unit: { select: { unitNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  if (tickets.length === 0) {
    return Response.json({ summary: 'Aktuell gibt es keine offenen Schadensmeldungen.' })
  }

  const ticketList = tickets.map(t =>
    `- [${t.priority}] ${t.title} — ${t.tenant.name}, ${t.property.name} ${t.unit?.unitNumber ?? ''} (${t.status === 'OPEN' ? 'Offen' : 'In Bearbeitung'})`
  ).join('\n')

  const summary = await generateText([
    {
      role: 'system',
      content: 'Du bist ein Assistent für Immobilienverwaltung. Erstelle eine kurze tägliche Zusammenfassung der offenen Schadensmeldungen. Hebe dringende Fälle hervor. Auf Deutsch, maximal 4 Sätze.',
    },
    {
      role: 'user',
      content: `Aktuelle offene Schadensmeldungen:\n${ticketList}`,
    },
  ])

  return Response.json({ summary: summary.trim() })
}
