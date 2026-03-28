// lib/stripe.ts — Stripe client + helpers
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

// Price IDs — set these in Vercel env vars after creating products in Stripe dashboard
export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  STARTER:  process.env.STRIPE_PRICE_STARTER,   // CHF 19/mo
  STANDARD: process.env.STRIPE_PRICE_STANDARD,  // CHF 39/mo
  PRO:      process.env.STRIPE_PRICE_PRO,        // CHF 79/mo
}

export const TRIAL_DAYS = 90

/**
 * Creates a Stripe Customer + Subscription (with trial for STARTER).
 * Returns { customerId, subscriptionId } or null if Stripe is not configured.
 */
export async function createStripeSubscription(opts: {
  email: string
  name: string
  companyName: string
  plan: 'STARTER' | 'STANDARD' | 'PRO'
}): Promise<{ customerId: string; subscriptionId: string } | null> {
  const priceId = STRIPE_PRICE_IDS[opts.plan]
  if (!process.env.STRIPE_SECRET_KEY || !priceId) return null

  const customer = await stripe.customers.create({
    email: opts.email,
    name: opts.name,
    metadata: { company: opts.companyName, plan: opts.plan },
  })

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    trial_period_days: opts.plan === 'STARTER' ? TRIAL_DAYS : undefined,
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    // Send Stripe's hosted trial reminder emails
    trial_settings: opts.plan === 'STARTER'
      ? { end_behavior: { missing_payment_method: 'cancel' } }
      : undefined,
  })

  return { customerId: customer.id, subscriptionId: subscription.id }
}
