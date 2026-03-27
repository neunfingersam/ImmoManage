import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { name, email, phone, company, plan, consent } = await req.json()

  if (!name || !email || !plan) {
    return NextResponse.json({ error: 'Name, E-Mail und Plan erforderlich' }, { status: 400 })
  }
  if (!consent) {
    return NextResponse.json({ error: 'Zustimmung erforderlich' }, { status: 400 })
  }

  const planLabels: Record<string, string> = {
    STARTER: 'Starter (CHF 0/Mt.)',
    STANDARD: 'Standard (CHF 39/Mt.)',
    PRO: 'Pro (CHF 79/Mt.)',
    ENTERPRISE: 'Enterprise (auf Anfrage)',
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #E8734A; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 18px;">🎯 Neue Plan-Anfrage</h1>
        <p style="color: #fff; margin: 6px 0 0; font-size: 14px; opacity: 0.85;">
          Interessent möchte <strong>${planLabels[plan] ?? plan}</strong>
        </p>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: 600; width: 140px; color: #374151;">Plan:</td>
              <td style="padding: 8px 0; color: #E8734A; font-weight: 700;">${planLabels[plan] ?? plan}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Name:</td>
              <td style="padding: 8px 0;">${name}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">E-Mail:</td>
              <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #1e3a5f;">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Telefon:</td>
              <td style="padding: 8px 0;"><a href="tel:${phone}">${phone}</a></td></tr>` : ''}
          ${company ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Firma/Name:</td>
              <td style="padding: 8px 0;">${company}</td></tr>` : ''}
        </table>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af;">
          ImmoManage · Plan-Anfrage vom ${new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </p>
      </div>
    </div>
  `

  await sendEmail('flaviopeter@immo-manage.ch', `Plan-Anfrage: ${planLabels[plan] ?? plan} – ${name}`, html)

  return NextResponse.json({ ok: true })
}
