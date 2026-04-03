import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailButton } from '@/lib/email'
import { createStripeCheckout, TRIAL_DAYS } from '@/lib/stripe'
import { checkRateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'
import type { Prisma } from '@/lib/generated/prisma/client'
import type { Plan } from '@/lib/generated/prisma/enums'

const VALID_PLANS: Plan[] = ['STARTER', 'STANDARD', 'PRO', 'ENTERPRISE']

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base
  let i = 2
  while (await prisma.company.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`
  }
  return slug
}

export async function POST(req: NextRequest) {
  // Rate-limit: max 5 registrations per IP per 15 minutes
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const rl = await checkRateLimit(`register:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte 15 Minuten.' }, { status: 429 })
  }

  const { name, email, password, companyName, plan } = await req.json()

  // Validation
  if (!name || !email || !password || !companyName || !plan) {
    return NextResponse.json({ error: 'Alle Felder sind erforderlich' }, { status: 400 })
  }
  if (!VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: 'Ungültiger Plan' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen haben' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Check if email already taken
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json({ error: 'Diese E-Mail-Adresse ist bereits registriert' }, { status: 409 })
  }

  const slug = await uniqueSlug(slugify(companyName))
  const passwordHash = await hash(password, 12)

  const planLabels: Record<Plan, string> = {
    STARTER: 'Starter',
    STANDARD: 'Standard',
    PRO: 'Pro',
    ENTERPRISE: 'Enterprise',
  }

  const planPrices: Record<Plan, string> = {
    STARTER: 'CHF 19/Monat',
    STANDARD: 'CHF 39/Monat',
    PRO: 'CHF 79/Monat',
    ENTERPRISE: 'Auf Anfrage',
  }

  const trialMonths: Record<Plan, number | null> = {
    STARTER: 3,
    STANDARD: 2,
    PRO: 1,
    ENTERPRISE: null,
  }

  const trialDays = (plan === 'STARTER' || plan === 'STANDARD' || plan === 'PRO')
    ? TRIAL_DAYS[plan]
    : 0
  const trialEndsAt = trialDays > 0
    ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
    : null

  // Create company + admin user in one transaction
  const verificationToken = crypto.randomBytes(32).toString('hex')
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 Stunden

  const company = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const company = await tx.company.create({
      data: {
        name: companyName.trim(),
        slug,
        plan,
        planStatus: trialDays > 0 ? 'TRIAL' : 'ACTIVE',
        trialEndsAt,
      },
    })
    const newUser = await tx.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'ADMIN',
        companyId: company.id,
        emailVerified: false,
      },
    })
    await tx.emailVerificationToken.create({
      data: { token: verificationToken, userId: newUser.id, expiresAt: verificationExpiresAt },
    })
    return company
  })

  // Create Stripe Checkout Session for paid plans
  let checkoutUrl: string | null = null
  if (plan === 'STARTER' || plan === 'STANDARD' || plan === 'PRO') {
    const baseUrl = 'https://immo-manage.ch'
    const stripeData = await createStripeCheckout({
      email: normalizedEmail,
      name: name.trim(),
      companyName: companyName.trim(),
      plan,
      companyId: company.id,
      successUrl: `${baseUrl}/de/dashboard?checkout=success`,
      cancelUrl: `${baseUrl}/de/preise`,
    }).catch((err) => { console.error('[Stripe Checkout Error]', err?.message); return null })

    if (stripeData) {
      checkoutUrl = stripeData.checkoutUrl
      await prisma.company.update({
        where: { id: company.id },
        data: { stripeCustomerId: stripeData.customerId },
      })
    }
  }

  // Welcome email to new user
  const planKey = plan as Plan
  const months = trialMonths[planKey]
  const trialEndDate = trialEndsAt
    ? trialEndsAt.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  sendEmail(
    normalizedEmail,
    'Willkommen bei ImmoManage!',
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #E8734A; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">Willkommen bei ImmoManage!</h1>
      </div>
      <div style="background: #f9fafb; padding: 28px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #1A1A2E;">Hallo ${name.trim()},</p>
        <p style="color: #374151;">Ihr Account wurde erfolgreich erstellt. Hier eine Zusammenfassung:</p>
        <table style="margin: 16px 0; width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; font-weight: 600; color: #374151; width: 160px;">Plan:</td>
              <td style="padding: 6px 0; color: #E8734A; font-weight: 700;">${planLabels[planKey]}</td></tr>
          ${months ? `
          <tr><td style="padding: 6px 0; font-weight: 600; color: #374151;">Gratis-Testphase:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #16a34a;">${months} ${months === 1 ? 'Monat' : 'Monate'} kostenlos${trialEndDate ? ` (bis ${trialEndDate})` : ''}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #374151;">Danach:</td>
              <td style="padding: 6px 0;">${planPrices[planKey]} — jederzeit kündbar</td></tr>
          ` : `
          <tr><td style="padding: 6px 0; font-weight: 600; color: #374151;">Preis:</td>
              <td style="padding: 6px 0;">${planPrices[planKey]}</td></tr>
          `}
          <tr><td style="padding: 6px 0; font-weight: 600; color: #374151;">Firma:</td>
              <td style="padding: 6px 0;">${companyName.trim()}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #374151;">E-Mail:</td>
              <td style="padding: 6px 0;">${normalizedEmail}</td></tr>
        </table>
        ${months ? `<p style="font-size: 13px; color: #6b7280; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px 16px;">
          ℹ️ Während der Testphase wird keine Zahlung fällig. Nach Ablauf der ${months} ${months === 1 ? 'Monats' : 'Monate'} wird automatisch ${planPrices[planKey]} abgebucht, sofern du nicht vorher kündigst.
        </p>` : ''}
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="margin:20px 0;">
          <tr>
            <td bgcolor="#fff7ed" style="background-color:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:16px 20px;">
              <p style="margin:0 0 8px; font-weight:700; font-family:Arial,Helvetica,sans-serif; color:#1A1A2E;">Schritt 1: E-Mail-Adresse bestätigen</p>
              <p style="margin:0 0 4px; font-size:14px; font-family:Arial,Helvetica,sans-serif; color:#374151;">Bitte bestätige zuerst deine E-Mail-Adresse, bevor du dich anmelden kannst. Der Link ist 24 Stunden gültig.</p>
              ${emailButton('E-Mail bestätigen →', `https://immo-manage.ch/api/auth/verify-email?token=${verificationToken}`)}
            </td>
          </tr>
        </table>
        <p style="font-size: 13px; color: #9ca3af;">
          Bei Fragen stehen wir Ihnen unter <a href="mailto:flaviopeter@immo-manage.ch" style="color: #E8734A;">flaviopeter@immo-manage.ch</a> zur Verfügung.
        </p>
      </div>
    </div>
    `
  ).catch(() => {})

  // Notification to you
  sendEmail(
    'flaviopeter@immo-manage.ch',
    `Neue Registrierung: ${planLabels[planKey]} (${planPrices[planKey]}) – ${name.trim()}`,
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #E8734A; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 18px;">🎉 Neue Registrierung</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p><strong>Plan:</strong> <span style="color: #E8734A; font-weight: 700;">${planLabels[planKey]}</span></p>
        <p><strong>Preis nach Testphase:</strong> ${planPrices[planKey]}</p>
        ${months ? `<p><strong>Testphase:</strong> ${months} ${months === 1 ? 'Monat' : 'Monate'}${trialEndDate ? ` (endet am ${trialEndDate})` : ''}</p>` : ''}
        <p><strong>Name:</strong> ${name.trim()}</p>
        <p><strong>E-Mail:</strong> <a href="mailto:${normalizedEmail}">${normalizedEmail}</a></p>
        <p><strong>Firma:</strong> ${companyName.trim()}</p>
        <p><strong>Registriert am:</strong> ${new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
    `
  ).catch(() => {})

  return NextResponse.json({ ok: true, checkoutUrl })
}
