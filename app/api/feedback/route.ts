import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { title, category, description, name, email } = await req.json()
  if (!title || !category || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a5f; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 18px;">Neues Feedback / Feature-Wunsch</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p><strong>Titel:</strong> ${title}</p>
        <p><strong>Kategorie:</strong> ${category}</p>
        <p><strong>Beschreibung:</strong> ${description}</p>
        ${name ? `<p><strong>Name:</strong> ${name}</p>` : ''}
        ${email ? `<p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>` : ''}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af;">ImmoManage · Feedback vom ${new Date().toLocaleDateString('de-CH')}</p>
      </div>
    </div>
  `

  await sendEmail('info@immo-manage.ch', `Feedback: ${title}`, html)

  return NextResponse.json({ ok: true })
}
