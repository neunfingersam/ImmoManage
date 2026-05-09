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

  const subject = plan
    ? `Demo-Anfrage [${plan}] von ${name}`
    : `Demo-Anfrage von ${name}`

  const date = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // ── Shared email primitives ──────────────────────────────────────────────────
  const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0EA;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EA;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
      ${content}
    </table>
  </td></tr>
</table>
</body>
</html>`

  const logoHeader = (bgColor: string, tagline: string) => `
<tr><td style="background:${bgColor};border-radius:12px 12px 0 0;padding:28px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:rgba(255,255,255,0.2);border-radius:8px;padding:8px 12px;vertical-align:middle;">
              <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Immo</span><span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:800;color:rgba(255,255,255,0.7);letter-spacing:-0.3px;">Manage</span>
            </td>
            <td style="padding-left:14px;vertical-align:middle;">
              <span style="font-size:11px;color:rgba(255,255,255,0.65);font-weight:500;letter-spacing:0.04em;">Schweizer Immobilienverwaltung</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="padding-top:20px;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">${tagline}</p>
    </td></tr>
  </table>
</td></tr>`

  const emailFooter = () => `
<tr><td style="background:#f9fafb;border-top:1px solid #e8e0d5;border-radius:0 0 12px 12px;padding:20px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="font-size:12px;color:#9ca3af;line-height:1.6;">
        ImmoManage · Schweizer Immobilienverwaltung<br>
        <a href="mailto:info@immo-manage.ch" style="color:#E8734A;text-decoration:none;">info@immo-manage.ch</a>
        &nbsp;·&nbsp;
        <a href="https://immo-manage.ch" style="color:#E8734A;text-decoration:none;">immo-manage.ch</a>
      </td>
      <td align="right" style="font-size:11px;color:#c4b8b0;white-space:nowrap;">${date}</td>
    </tr>
  </table>
</td></tr>`

  // ── Internal notification (to info@immo-manage.ch) ───────────────────────────
  const html = emailWrapper(`
    ${logoHeader('#1a1a2e', 'Neue Demo-Anfrage eingegangen')}
    <tr><td style="background:#ffffff;padding:28px 32px;">
      ${plan ? `
      <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td style="background:#E8734A;border-radius:6px;padding:6px 14px;">
            <span style="font-size:13px;font-weight:700;color:#ffffff;">Plan: ${plan}</span>
          </td>
        </tr>
      </table>` : ''}
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0d5;border-radius:8px;overflow:hidden;margin-bottom:20px;">
        <tr style="background:#f9fafb;">
          <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;width:120px;">Name</td>
          <td style="padding:10px 16px;font-size:14px;color:#1a1a2e;font-weight:600;border-left:1px solid #e8e0d5;">${name}</td>
        </tr>
        <tr style="border-top:1px solid #e8e0d5;">
          <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">E-Mail</td>
          <td style="padding:10px 16px;border-left:1px solid #e8e0d5;"><a href="mailto:${email}" style="color:#E8734A;font-size:14px;text-decoration:none;">${email}</a></td>
        </tr>
        ${plan ? `
        <tr style="border-top:1px solid #e8e0d5;">
          <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">Plan</td>
          <td style="padding:10px 16px;font-size:14px;color:#1a1a2e;font-weight:600;border-left:1px solid #e8e0d5;">${plan}</td>
        </tr>` : ''}
        ${message ? `
        <tr style="border-top:1px solid #e8e0d5;">
          <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;vertical-align:top;">Nachricht</td>
          <td style="padding:10px 16px;font-size:14px;color:#374151;line-height:1.6;border-left:1px solid #e8e0d5;">${message}</td>
        </tr>` : ''}
      </table>
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#E8734A;border-radius:8px;padding:10px 20px;">
            <a href="mailto:${email}" style="font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Direkt antworten</a>
          </td>
        </tr>
      </table>
    </td></tr>
    ${emailFooter()}
  `)

  // ── Confirmation to requester ────────────────────────────────────────────────
  const confirmationHtml = emailWrapper(`
    ${logoHeader('#E8734A', 'Ihre Anfrage ist bei uns eingegangen.')}
    <tr><td style="background:#ffffff;padding:32px 32px 24px;">
      <p style="margin:0 0 12px;font-size:17px;color:#1a1a2e;font-weight:600;">Hallo ${name}</p>
      <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">Vielen Dank für Ihr Interesse an ImmoManage. Wir haben Ihre Anfrage erhalten und werden uns innerhalb von <strong style="color:#1a1a2e;">24 Stunden</strong> persönlich bei Ihnen melden.</p>
      ${plan ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background:#fff7f5;border:1px solid #fce4da;border-left:4px solid #E8734A;border-radius:0 8px 8px 0;">
        <tr>
          <td style="padding:14px 18px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#E8734A;text-transform:uppercase;letter-spacing:0.06em;">Gewählter Plan</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#1a1a2e;">${plan}</p>
          </td>
        </tr>
      </table>` : ''}
      ${message ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background:#f9fafb;border:1px solid #e8e0d5;border-radius:8px;">
        <tr><td style="padding:14px 18px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">Ihre Nachricht</p>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${message}</p>
        </td></tr>
      </table>` : ''}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e8e0d5;border-radius:8px;margin-bottom:8px;">
        <tr>
          <td style="padding:16px 18px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Fragen? Wir helfen gerne.</p>
            <a href="mailto:info@immo-manage.ch" style="font-size:14px;font-weight:600;color:#E8734A;text-decoration:none;">info@immo-manage.ch</a>
          </td>
        </tr>
      </table>
    </td></tr>
    ${emailFooter()}
  `)

  await Promise.all([
    sendEmail('info@immo-manage.ch', subject, html),
    sendEmail(email, 'Ihre Anfrage bei ImmoManage', confirmationHtml),
  ])

  return NextResponse.json({ ok: true })
}
