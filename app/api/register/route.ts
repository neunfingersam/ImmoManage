import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import type { Plan } from '@/lib/generated/prisma'

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
  const { name, email, password, companyName, plan } = await req.json()

  // Validation
  if (!name || !email || !password || !companyName || !plan) {
    return NextResponse.json({ error: 'Alle Felder sind erforderlich' }, { status: 400 })
  }
  if (!VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: 'Ungültiger Plan' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Passwort muss mindestens 6 Zeichen haben' }, { status: 400 })
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
    STARTER: 'Starter (CHF 0/Mt.)',
    STANDARD: 'Standard (CHF 39/Mt.)',
    PRO: 'Pro (CHF 79/Mt.)',
    ENTERPRISE: 'Enterprise',
  }

  // Create company + admin user in one transaction
  const user = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: { name: companyName.trim(), slug, plan },
    })
    return tx.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'ADMIN',
        companyId: company.id,
      },
    })
  })

  // Welcome email to new user
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
        <p style="color: #374151;">Ihr Account wurde erfolgreich erstellt. Sie können sich jetzt anmelden:</p>
        <table style="margin: 16px 0; width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; font-weight: 600; color: #374151; width: 140px;">Plan:</td>
              <td style="padding: 6px 0; color: #E8734A; font-weight: 700;">${planLabels[plan as Plan]}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #374151;">Firma:</td>
              <td style="padding: 6px 0;">${companyName.trim()}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #374151;">E-Mail:</td>
              <td style="padding: 6px 0;">${normalizedEmail}</td></tr>
        </table>
        <p style="margin: 24px 0;">
          <a href="${process.env.NEXTAUTH_URL ?? 'https://immo-manage.ch'}/de/auth/login"
             style="background: #E8734A; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Jetzt anmelden →
          </a>
        </p>
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
    `Neue Registrierung: ${planLabels[plan as Plan]} – ${name.trim()}`,
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #E8734A; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 18px;">🎉 Neue Registrierung</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p><strong>Plan:</strong> <span style="color: #E8734A; font-weight: 700;">${planLabels[plan as Plan]}</span></p>
        <p><strong>Name:</strong> ${name.trim()}</p>
        <p><strong>E-Mail:</strong> <a href="mailto:${normalizedEmail}">${normalizedEmail}</a></p>
        <p><strong>Firma:</strong> ${companyName.trim()}</p>
        <p><strong>Registriert am:</strong> ${new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
    `
  ).catch(() => {})

  return NextResponse.json({ ok: true })
}
