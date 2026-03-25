import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isOllamaAvailable, getEmbedding, ChatMessage } from '@/lib/agent/ollama'
import { queryChunks } from '@/lib/agent/vectra'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId || session.user.role === 'MIETER') {
    return new Response('Nicht autorisiert', { status: 401 })
  }

  const companyId: string = session.user.companyId
  const role = session.user.role as 'ADMIN' | 'VERMIETER'
  const userId = session.user.id
  const { message, messages: history } = await req.json()
  if (!message) return new Response('Nachricht fehlt', { status: 400 })

  if (!(await isOllamaAvailable())) {
    return new Response(
      JSON.stringify({ error: 'KI-Assistent ist momentan nicht verfügbar.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Step 1: VERMIETER-Scope: nur zugewiesene Immobilien laden
  let assignedPropertyIds: string[] | undefined
  if (role === 'VERMIETER') {
    const assignments = await prisma.propertyAssignment.findMany({
      where: { userId },
      select: { propertyId: true },
    })
    assignedPropertyIds = assignments.map((a) => a.propertyId)
  }

  // Step 2: Firmendaten als Kontext laden — gefiltert nach Rolle
  const propertyFilter = assignedPropertyIds
    ? { companyId, id: { in: assignedPropertyIds } }
    : { companyId }

  const [properties, leases, tickets, members] = await Promise.all([
    prisma.property.findMany({
      where: propertyFilter,
      include: { units: { include: { leases: { where: { status: 'ACTIVE' }, include: { tenant: { select: { name: true, email: true } } } } } } },
    }),
    prisma.lease.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        ...(assignedPropertyIds ? { unit: { propertyId: { in: assignedPropertyIds } } } : {}),
      },
      include: {
        tenant: { select: { name: true, email: true, phone: true } },
        unit: { include: { property: { select: { name: true, address: true } } } },
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.ticket.findMany({
      where: {
        companyId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        ...(assignedPropertyIds ? { propertyId: { in: assignedPropertyIds } } : {}),
      },
      include: {
        tenant: { select: { name: true } },
        property: { select: { name: true } },
        unit: { select: { unitNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    role === 'ADMIN'
      ? prisma.user.findMany({
          where: { companyId, role: { in: ['ADMIN', 'VERMIETER'] } },
          select: { name: true, role: true, email: true, active: true },
        })
      : Promise.resolve([]),
  ])

  const propContext = properties.map(p => {
    const activeLeases = p.units.flatMap(u => u.leases)
    return `Immobilie: ${p.name} (${p.address}) — ${p.units.length} Einheiten, ${activeLeases.length} aktive Mietverhältnisse`
  }).join('\n')

  const leaseContext = leases.map(l =>
    `Mieter: ${l.tenant.name} (${l.tenant.email}${l.tenant.phone ? ', ' + l.tenant.phone : ''}) — ${l.unit.property.name}, ${l.unit.unitNumber} — Kaltmiete: ${l.coldRent.toFixed(2)} €, Nebenkosten: ${l.extraCosts.toFixed(2)} €, Warmmiete: ${(l.coldRent + l.extraCosts).toFixed(2)} €`
  ).join('\n')

  const ticketContext = tickets.length > 0
    ? tickets.map(t =>
        `[${t.priority}] ${t.title} — ${t.tenant.name}, ${t.property.name} ${t.unit?.unitNumber ?? ''} (${t.status})`
      ).join('\n')
    : 'Keine offenen Tickets'

  const teamContext = members.map((m: { name: string | null; role: string; active: boolean }) =>
    `${m.name} (${m.role === 'ADMIN' ? 'Administrator' : 'Vermieter'}, ${m.active ? 'aktiv' : 'inaktiv'})`
  ).join('\n')

  // Step 3: RAG — Dokumente durchsuchen, gefiltert nach Rolle
  let docContext = ''
  try {
    const queryVector = await getEmbedding(message)
    const chunks = await queryChunks(queryVector, {
      companyId,
      role,
      ...(assignedPropertyIds ? { propertyIds: assignedPropertyIds } : {}),
    })
    if (chunks.length > 0) {
      docContext = '=== Relevante Dokumente ===\n' + chunks.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n')
    }
  } catch {
    // Embeddings nicht verfügbar — weiter ohne RAG
  }

  const contextSections = [
    '=== Immobilien ===\n' + (propContext || 'Keine'),
    '=== Aktive Mietverträge ===\n' + (leaseContext || 'Keine'),
    '=== Offene Schadensmeldungen ===\n' + ticketContext,
    ...(role === 'ADMIN' ? ['=== Team ===\n' + (teamContext || 'Keine')] : []),
    docContext,
  ].filter(Boolean).join('\n\n')

  // Step 4: Rollenspezifischer System-Prompt
  const roleHint = role === 'VERMIETER'
    ? 'Du sprichst mit einem Vermieter. Zeige nur Daten zu seinen zugewiesenen Immobilien.'
    : 'Du sprichst mit einem Administrator. Du hast Zugriff auf alle Daten der Firma.'

  const systemPrompt = `Du bist ein intelligenter Assistent für die Immobilienverwaltung. Antworte auf Deutsch.
${roleHint}

${contextSections}

Beantworte Fragen zu Mietern, Immobilien, Mietverträgen, Schadensmeldungen und Dokumenten direkt aus diesen Daten.`

  const ollamaMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(history ?? []).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { streamChat: sc } = await import('@/lib/agent/ollama')
        for await (const token of sc(ollamaMessages)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : 'Fehler'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  })
}
