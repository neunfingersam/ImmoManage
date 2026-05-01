import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  // Magic-byte validation — verify actual file bytes match declared image type
  const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const hex = Array.from(headerBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const isJpeg = hex.startsWith('ffd8ff')
  const isPng  = hex.startsWith('89504e47')
  const isGif  = hex.startsWith('47494638')                    // GIF8
  const isWebp = hex.startsWith('52494646') && hex.slice(16, 24) === '57454250' // RIFF....WEBP
  if (!isJpeg && !isPng && !isGif && !isWebp) {
    return NextResponse.json({ error: 'File content does not match declared type' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `tickets/${session.user.id}-${Date.now()}.${ext}`

  const blob = await put(filename, file, { access: 'public' })

  return NextResponse.json({ url: blob.url })
}
