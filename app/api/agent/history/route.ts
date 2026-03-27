// app/api/agent/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId)
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenantId')

  // Mieter sehen immer nur ihren eigenen Verlauf
  const isMieter = session.user.role === 'MIETER'
  const where = isMieter
    ? { companyId: session.user.companyId, tenantId: session.user.id }
    : tenantId
      ? { companyId: session.user.companyId, tenantId }
      : { companyId: session.user.companyId }

  const chats = await prisma.agentChat.findMany({
    where,
    include: {
      tenant: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(chats)
}
