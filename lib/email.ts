// lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
  ignoreTLS: !process.env.SMTP_USER,
})

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? '"ImmoManage" <noreply@immomanage.local>',
    to,
    subject,
    html,
  })
}

export async function sendEscalationEmail(opts: {
  vermieterEmail: string
  vermieterName: string
  tenantName: string
  question: string
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E8734A;">KI-Assistent: Weiterleitungsanfrage</h2>
      <p>Hallo ${opts.vermieterName},</p>
      <p>Ein Mieter hat eine Frage gestellt, die der KI-Assistent nicht beantworten konnte:</p>
      <blockquote style="border-left: 3px solid #E8734A; padding-left: 16px; color: #555;">
        ${opts.question}
      </blockquote>
      <p>Mieter: <strong>${opts.tenantName}</strong></p>
      <p>Bitte melde dich direkt beim Mieter.</p>
      <hr style="border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #999;">ImmoManage · Automatische Benachrichtigung</p>
    </div>
  `
  await sendEmail(
    opts.vermieterEmail,
    `Mieterfrage weitergeleitet von ${opts.tenantName}`,
    html
  )
}

export async function sendEventNotificationEmail(opts: {
  tenantEmail: string
  tenantName: string
  eventTitle: string
  eventDate: Date
  propertyName?: string
}) {
  const dateStr = opts.eventDate.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E8734A;">Neues Ereignis in deiner Immobilie</h2>
      <p>Hallo ${opts.tenantName},</p>
      <p>Es wurde ein neues Ereignis eingetragen, das dich betrifft:</p>
      <div style="background: #F0E6D3; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-weight: bold; font-size: 16px;">${opts.eventTitle}</p>
        <p style="margin: 8px 0 0; color: #555;">${dateStr}</p>
        ${opts.propertyName ? `<p style="margin: 4px 0 0; color: #555; font-size: 14px;">${opts.propertyName}</p>` : ''}
      </div>
      <hr style="border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #999;">ImmoManage · Automatische Benachrichtigung</p>
    </div>
  `
  await sendEmail(
    opts.tenantEmail,
    `Neues Ereignis: ${opts.eventTitle}`,
    html
  )
}
