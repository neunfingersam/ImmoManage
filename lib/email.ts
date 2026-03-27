// lib/email.ts
import { Resend } from 'resend'

const FROM = 'ImmoManage <noreply@immo-manage.ch>'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set')
  return new Resend(key)
}

export async function sendEmail(to: string, subject: string, html: string) {
  await getResend().emails.send({ from: FROM, to, subject, html })
}

export async function sendTenantInviteEmail(opts: {
  tenantEmail: string
  tenantName: string
  companyName: string
  inviteUrl: string
  expiresHours?: number
}) {
  const expires = opts.expiresHours ?? 72
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #1e3a5f; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 20px;">Willkommen bei ImmoManage</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hallo ${opts.tenantName},</p>
        <p><strong>${opts.companyName}</strong> hat ein Mieter-Konto für Sie eingerichtet. Mit ImmoManage können Sie Ihre Mietunterlagen einsehen, Schadensmeldungen erstellen und mit Ihrer Hausverwaltung kommunizieren.</p>
        <p style="margin: 28px 0;">
          <a href="${opts.inviteUrl}" style="background: #1e3a5f; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Passwort festlegen &amp; einloggen
          </a>
        </p>
        <p style="color: #6b7280; font-size: 13px;">Dieser Link ist <strong>${expires} Stunden</strong> gültig. Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af;">ImmoManage · Verwaltet durch ${opts.companyName}</p>
      </div>
    </div>
  `
  await sendEmail(opts.tenantEmail, `Einladung zu ImmoManage — ${opts.companyName}`, html)
}

export async function sendEscalationEmail(opts: {
  vermieterEmail: string
  vermieterName: string
  tenantName: string
  question: string
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">KI-Assistent: Weiterleitungsanfrage</h2>
      <p>Hallo ${opts.vermieterName},</p>
      <p>Ein Mieter hat eine Frage gestellt, die der KI-Assistent nicht beantworten konnte:</p>
      <blockquote style="border-left: 3px solid #1e3a5f; padding-left: 16px; color: #555;">
        ${opts.question}
      </blockquote>
      <p>Mieter: <strong>${opts.tenantName}</strong></p>
      <p>Bitte melde dich direkt beim Mieter.</p>
      <hr style="border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #999;">ImmoManage · Automatische Benachrichtigung</p>
    </div>
  `
  await sendEmail(opts.vermieterEmail, `Mieterfrage weitergeleitet von ${opts.tenantName}`, html)
}

export async function sendDeletionRequestEmail(opts: {
  adminEmail: string
  adminName: string
  userName: string
  userEmail: string
  approveUrl: string
  rejectUrl: string
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a5f; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 18px;">Kontolöschungsantrag</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hallo ${opts.adminName},</p>
        <p>Der folgende Nutzer hat beantragt, sein Konto zu löschen:</p>
        <div style="background: #e8edf4; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold;">${opts.userName}</p>
          <p style="margin: 4px 0 0; color: #555; font-size: 14px;">${opts.userEmail}</p>
        </div>
        <p>Bitte prüfen Sie den Antrag in der Verwaltungsoberfläche und genehmigen oder lehnen Sie ihn ab.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af;">ImmoManage · Automatische Benachrichtigung</p>
      </div>
    </div>
  `
  await sendEmail(opts.adminEmail, `Kontolöschungsantrag von ${opts.userName}`, html)
}

export async function sendDeletionApprovedEmail(opts: {
  userEmail: string
  userName: string
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a5f; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 18px;">Ihr Konto wurde gelöscht</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hallo ${opts.userName},</p>
        <p>Ihr Antrag auf Kontolöschung wurde genehmigt. Ihre persönlichen Daten wurden gemäss Art. 17 DSGVO / DSG aus unserem System entfernt.</p>
        <p style="color: #6b7280; font-size: 13px;">Falls Sie Fragen haben, wenden Sie sich an info@immo-manage.ch.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af;">ImmoManage</p>
      </div>
    </div>
  `
  await sendEmail(opts.userEmail, 'Ihr Konto wurde gelöscht — ImmoManage', html)
}

export async function sendDeletionRejectedEmail(opts: {
  userEmail: string
  userName: string
  reason?: string
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a5f; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 18px;">Löschantrag abgelehnt</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hallo ${opts.userName},</p>
        <p>Ihr Antrag auf Kontolöschung wurde abgelehnt.</p>
        ${opts.reason ? `<p><strong>Begründung:</strong> ${opts.reason}</p>` : ''}
        <p style="color: #6b7280; font-size: 13px;">Falls Sie Fragen haben, wenden Sie sich direkt an Ihre Hausverwaltung.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af;">ImmoManage</p>
      </div>
    </div>
  `
  await sendEmail(opts.userEmail, 'Löschantrag abgelehnt — ImmoManage', html)
}

export async function sendEventNotificationEmail(opts: {
  tenantEmail: string
  tenantName: string
  eventTitle: string
  eventDate: Date
  propertyName?: string
}) {
  const dateStr = opts.eventDate.toLocaleDateString('de-CH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a5f; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 18px;">Neuer Termin</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hallo ${opts.tenantName},</p>
        <p>Es wurde ein neuer Termin für Sie eingetragen:</p>
        <div style="background: #e8edf4; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold; font-size: 16px;">${opts.eventTitle}</p>
          <p style="margin: 8px 0 0; color: #555;">${dateStr}</p>
          ${opts.propertyName ? `<p style="margin: 4px 0 0; color: #555; font-size: 14px;">${opts.propertyName}</p>` : ''}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af;">ImmoManage · Automatische Benachrichtigung</p>
      </div>
    </div>
  `
  await sendEmail(opts.tenantEmail, `Neuer Termin: ${opts.eventTitle}`, html)
}
