// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type { PlanStatus } from '@/lib/generated/prisma/enums'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

// Stripe requires raw body for signature verification
export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: 'Not configured' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  const statusMap: Record<Stripe.Subscription.Status, PlanStatus | null> = {
    active:             'ACTIVE',  // clears PENDING_PAYMENT too
    trialing:           'TRIAL',
    past_due:           'PAST_DUE',
    canceled:           'CANCELLED',
    unpaid:             'PAST_DUE',
    incomplete:         null,
    incomplete_expired: 'CANCELLED',
    paused:             'PAST_DUE',
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      // Checkout finished — link subscription to company via companyId in metadata
      const session = event.data.object as Stripe.Checkout.Session
      const companyId = session.metadata?.companyId
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id
      if (companyId && subscriptionId) {
        await prisma.company.update({
          where: { id: companyId },
          data: { stripeSubscriptionId: subscriptionId },
        })
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === 'string'
        ? subscription.customer : subscription.customer?.id
      if (!customerId) break
      // If cancel_at_period_end is set, treat as cancelled so admin can request deletion
      const newStatus = subscription.cancel_at_period_end
        ? 'CANCELLED'
        : statusMap[subscription.status]
      if (!newStatus) break
      await prisma.company.updateMany({
        where: { stripeCustomerId: customerId },
        data: { planStatus: newStatus, stripeSubscriptionId: subscription.id },
      })
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer : invoice.customer?.id
      if (!customerId) break
      await prisma.company.updateMany({
        where: { stripeCustomerId: customerId },
        data: { planStatus: 'ACTIVE' },
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer : invoice.customer?.id
      if (!customerId) break
      await prisma.company.updateMany({
        where: { stripeCustomerId: customerId },
        data: { planStatus: 'PAST_DUE' },
      })
      break
    }
  }

  return NextResponse.json({ ok: true })
}
