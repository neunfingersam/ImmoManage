// lib/stripe.ts — Stripe client + helpers
import Stripe from 'stripe'

function createStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  })
}

export const stripe = createStripeClient()

// Price IDs — set these in Vercel env vars after creating products in Stripe dashboard
export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  STARTER:  process.env.STRIPE_PRICE_STARTER,   // CHF 19/mo
  STANDARD: process.env.STRIPE_PRICE_STANDARD,  // CHF 39/mo
  PRO:      process.env.STRIPE_PRICE_PRO,        // CHF 79/mo
}

export const TRIAL_DAYS: Record<string, number> = {
  STARTER:  90, // 3 Monate
  STANDARD: 60, // 2 Monate
  PRO:      30, // 1 Monat
}

/**
 * Creates a Stripe Customer + Checkout Session with trial period per plan.
 * Returns { customerId, checkoutUrl } or null if Stripe is not configured.
 */
export async function createStripeCheckout(opts: {
  email: string
  name: string
  companyName: string
  plan: 'STARTER' | 'STANDARD' | 'PRO'
  companyId: string
  successUrl: string
  cancelUrl: string
}): Promise<{ customerId: string; checkoutUrl: string } | null> {
  const priceId = STRIPE_PRICE_IDS[opts.plan]
  if (!stripe) { console.error('[Stripe] STRIPE_SECRET_KEY not set'); return null }
  if (!priceId) { console.error('[Stripe] Price ID not set for plan:', opts.plan); return null }

  const customer = await stripe.customers.create({
    email: opts.email,
    name: opts.name,
    metadata: { company: opts.companyName, plan: opts.plan, companyId: opts.companyId },
  })

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_DAYS[opts.plan] ?? 0,
      trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
      metadata: { companyId: opts.companyId },
    },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: { companyId: opts.companyId },
  })

  return { customerId: customer.id, checkoutUrl: session.url! }
}
