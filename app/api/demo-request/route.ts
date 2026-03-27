import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { name, email, message, consent } = await req.json()
  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
  }
  if (!consent) {
    return NextResponse.json({ error: 'Consent required' }, { status: 400 })
  }
  // Demo requests are received — forward to email or CRM here if needed
  console.log('[Demo Request] new request received at', new Date().toISOString())
  return NextResponse.json({ ok: true })
}
