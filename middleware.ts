// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: { role?: string } | null } }) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role

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
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        if (pathname.startsWith('/auth') || pathname.startsWith('/403')) {
          return true
        }
        // /uploads/* erfordert einen gültigen Login
        return !!token
      },
    },
    pages: {
      signIn: '/auth/login',
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tenant/:path*',
    '/superadmin/:path*',
    '/auth/:path*',
    '/uploads/:path*',
  ],
}
