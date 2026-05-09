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

  await sendEmail('info@immo-manage.ch', subject, html)

  return NextResponse.json({ ok: true })
}
