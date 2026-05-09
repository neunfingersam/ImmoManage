import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { name, email, message, consent, plan } = await req.json()
  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
  }
  if (!consent) {
    return NextResponse.json({ error: 'Consent required' }, { status: 400 })
  }

  const planBadge = plan
    ? `<div style="display:inline-block;background:#E8734A;color:white;font-weight:700;font-size:13px;padding:4px 12px;border-radius:6px;margin-bottom:16px;">Gewünschter Plan: ${plan}</div>`
    : ''

  const subject = plan
    ? `Demo-Anfrage [${plan}] von ${name}`
    : `Demo-Anfrage von ${name}`

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a5f; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 18px;">Neue Demo-Anfrage</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        ${planBadge}
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>
        ${message ? `<p><strong>Nachricht:</strong> ${message}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af;">ImmoManage · Demo-Anfrage vom ${new Date().toLocaleDateString('de-CH')}</p>
      </div>
    </div>
  `

  const confirmationHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #E8734A; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 20px;">Ihre Anfrage ist eingegangen</h1>
      </div>
      <div style="background: #f9fafb; padding: 28px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #1a1a2e;">Hallo ${name}</p>
        <p style="color: #4b5563; line-height: 1.6;">Vielen Dank für Ihr Interesse an ImmoManage. Wir haben Ihre Anfrage erhalten und melden uns innerhalb von <strong>24 Stunden</strong> bei Ihnen.</p>
        ${plan ? `<div style="margin: 20px 0; padding: 14px 16px; background: #fff7f5; border-left: 3px solid #E8734A; border-radius: 4px;"><strong style="color: #E8734A;">Gewählter Plan:</strong> <span style="color: #1a1a2e;">${plan}</span></div>` : ''}
        ${message ? `<div style="margin: 20px 0; padding: 14px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 6px;"><strong style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: .05em;">Ihre Nachricht</strong><p style="margin: 6px 0 0; color: #374151;">${message}</p></div>` : ''}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="font-size: 13px; color: #9ca3af;">Bei Fragen erreichen Sie uns unter <a href="mailto:info@immo-manage.ch" style="color: #E8734A;">info@immo-manage.ch</a></p>
        <p style="font-size: 12px; color: #c4b8b0; margin-top: 4px;">ImmoManage · Schweizer Immobilienverwaltung</p>
      </div>
    </div>
  `

  await Promise.all([
    sendEmail('info@immo-manage.ch', subject, html),
    sendEmail(email, 'Ihre Anfrage bei ImmoManage', confirmationHtml),
  ])

  return NextResponse.json({ ok: true })
}
