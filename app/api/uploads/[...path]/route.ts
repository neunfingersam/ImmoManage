import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { path: segments } = await params
  const [companyId] = segments

  if (companyId !== session.user.companyId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Prevent path traversal: resolve and verify the path stays within uploads/
  const uploadsBase = path.join(process.cwd(), 'private', 'uploads')
  const filePath = path.resolve(uploadsBase, ...segments)
  if (!filePath.startsWith(uploadsBase + path.sep)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const file = await readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream'
    return new NextResponse(file, { headers: { 'Content-Type': contentType } })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}
