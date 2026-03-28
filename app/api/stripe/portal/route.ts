// app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { stripeCustomerId: true },
  })

  if (!company?.stripeCustomerId) {
    return NextResponse.json({ error: 'Kein Stripe-Konto verknüpft' }, { status: 400 })
  }

  const baseUrl = 'https://immo-manage.ch'
  const { searchParams } = new URL(req.url)
  const locale = searchParams.get('locale') ?? 'de'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: `${baseUrl}/${locale}/dashboard`,
  })

  return NextResponse.json({ url: portalSession.url })
}
