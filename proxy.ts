// middleware.ts — Edge-kompatibel via getToken statt withAuth
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Öffentliche Routen immer durchlassen
  if (pathname.startsWith('/auth') || pathname.startsWith('/403')) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  // Nicht eingeloggt → Login
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  const role = token.role as string

  if (pathname.startsWith('/dashboard') && role === 'MIETER') {
    return NextResponse.redirect(new URL('/403', req.url))
  }

  if (pathname.startsWith('/tenant') && role !== 'MIETER') {
    return NextResponse.redirect(new URL('/403', req.url))
  }

  if (pathname.startsWith('/superadmin') && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/403', req.url))
  }

  if (pathname.startsWith('/dashboard/team') && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/403', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tenant/:path*',
    '/superadmin/:path*',
    '/auth/:path*',
    '/uploads/:path*',
  ],
}
