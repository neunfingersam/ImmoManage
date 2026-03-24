// app/api/agent/chat/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isOllamaAvailable, getEmbedding, streamChat, ChatMessage } from '@/lib/agent/ollama'
import { queryChunks } from '@/lib/agent/vectra'
import { shouldEscalate } from '@/lib/agent/escalation'
import { buildTenantContext, searchTenantDocuments } from '@/lib/agent/chat-context'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.companyId) {
    return new Response('Nicht autorisiert', { status: 401 })
  }

  const userId: string = session.user.id
  const companyId: string = session.user.companyId

  const { message, chatId } = await req.json()
  if (!message) return new Response('Nachricht fehlt', { status: 400 })

  if (!(await isOllamaAvailable())) {
    return new Response(
      JSON.stringify({ error: 'KI-Assistent ist momentan nicht verfügbar. Bitte kontaktiere deinen Vermieter direkt.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Chat erstellen oder laden
  let chat = chatId
    ? await prisma.agentChat.findFirst({ where: { id: chatId, tenantId: userId } })
    : null
  if (!chat) {
    chat = await prisma.agentChat.create({ data: { companyId, tenantId: userId } })
  }

  // Kontext aufbauen (extrahiert)
  const { leaseContext, billContext, propertyIds, unitInfo } = await buildTenantContext(userId)

  // Dokument-Suche (extrahiert)
  const queryVector = await getEmbedding(message)
  const { contextText, chunkIds } = await searchTenantDocuments(
    queryVector, companyId, userId, propertyIds, queryChunks
  )

  const structuredContext = [leaseContext, billContext].filter(Boolean).join('\n\n')
  const fullContext = [structuredContext, contextText].filter(Boolean).join('\n\n---\n\n')
  const hasContext = fullContext.length > 0

  const systemPrompt = `Du bist ein hilfreicher KI-Assistent für Mieter der Immobilienverwaltung. Antworte immer auf Deutsch.
${unitInfo ? `Der Mieter wohnt in: ${unitInfo}` : ''}

${hasContext
    ? `Nutze die folgenden Informationen um die Frage zu beantworten. Diese umfassen Mietvertragsdaten, Nebenkostenabrechnungen und hochgeladene Dokumente:\n\n${fullContext}\n\nBeantworte Fragen zu Miethöhe, Vertragsdetails, Nebenkosten und Hausregeln direkt aus diesen Daten. Zitiere bei Bedarf die relevante Stelle.`
    : `Es sind keine Daten für diesen Mieter verfügbar. Teile dem Mieter höflich mit, dass du keine Unterlagen findest und empfehle ihn, seinen Vermieter direkt zu kontaktieren.`
  }`

  const history = await prisma.agentMessage.findMany({
    where: { chatId: chat.id },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })

  const ollamaMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({
      role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  await prisma.agentMessage.create({
    data: { chatId: chat.id, role: 'USER', content: message, sources: JSON.stringify([]) },
  })

  const encoder = new TextEncoder()
  let fullResponse = ''
  const currentChat = chat

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of streamChat(ollamaMessages)) {
          fullResponse += token
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
        }

        const escalate = shouldEscalate(fullResponse, hasContext)

        await prisma.agentMessage.create({
          data: {
            chatId: currentChat.id,
            role: 'AGENT',
            content: fullResponse,
            sources: JSON.stringify(chunkIds),
            wasEscalated: escalate,
          },
        })

        if (escalate) {
          const vermieter = await prisma.user.findFirst({
            where: { companyId, role: { in: ['ADMIN', 'VERMIETER'] } },
          })
          if (vermieter) {
            await prisma.message.create({
              data: {
                companyId,
                fromId: userId,
                toId: vermieter.id,
                text: `[KI-Eskalation] Frage von Mieter: "${message}"`,
                source: 'AI_ESCALATION',
              },
            })
            try {
              const { sendEscalationEmail } = await import('@/lib/email')
              const tenantUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
              if (tenantUser) {
                await sendEscalationEmail({
                  vermieterEmail: vermieter.email,
                  vermieterName: vermieter.name,
                  tenantName: tenantUser.name,
                  question: message,
                })
              }
            } catch { /* Email optional */ }
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, chatId: currentChat.id, escalated: escalate })}\n\n`))
        controller.close()
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : 'Unbekannter Fehler'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  })
}
