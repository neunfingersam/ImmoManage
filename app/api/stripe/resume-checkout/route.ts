// app/api/stripe/resume-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { stripeCustomerId: true, plan: true, id: true },
  })

  if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const locale = searchParams.get('locale') ?? 'de'
  const baseUrl = 'https://immo-manage.ch'
  const priceId = STRIPE_PRICE_IDS[company.plan]

  if (!priceId) return NextResponse.json({ error: 'Kein Preis konfiguriert' }, { status: 400 })
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: company.stripeCustomerId ?? undefined,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { metadata: { companyId: company.id } },
    success_url: `${baseUrl}/${locale}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/${locale}/dashboard`,
    metadata: { companyId: company.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
