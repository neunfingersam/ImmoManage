import createIntlMiddleware from 'next-intl/middleware'
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routing, type Locale } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

// Extract locale from a path like /de/dashboard → 'de', or fall back to default
function getLocaleFromPath(pathname: string): Locale {
  const match = pathname.match(/^\/(de|fr|en|it)(\/|$)/)
  return (match?.[1] as Locale) ?? routing.defaultLocale
}

// Strip the locale prefix to get the internal path (/de/dashboard → /dashboard)
function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(de|fr|en|it)(\/|$)/, '/') || '/'
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const internalPath = stripLocale(pathname)
  const locale = getLocaleFromPath(pathname)

  // API routes (especially NextAuth) — pass through without auth check
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Public routes: always allow through (intl handles locale prefix)
  if (
    internalPath === '/' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    internalPath.startsWith('/auth') ||
    internalPath.startsWith('/403') ||
    internalPath.startsWith('/datenschutz') ||
    internalPath.startsWith('/impressum') ||
    internalPath.startsWith('/preise') ||
    internalPath.startsWith('/landing') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/403')
  ) {
    return intlMiddleware(req)
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  // Not authenticated → redirect to locale-aware login
  if (!token) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url))
  }

  const role = token.role as string

  // Explicit early guard: EIGENTUEMER must never access /dashboard routes
  if (role === 'EIGENTUEMER' && internalPath.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL(`/${locale}/owner`, req.url))
  }

  if (internalPath.startsWith('/dashboard') && role === 'MIETER') {
    return NextResponse.redirect(new URL(`/${locale}/403`, req.url))
  }

  // /tenant is restricted to MIETER only — EIGENTUEMER and all other non-MIETER roles are blocked
  if (internalPath.startsWith('/tenant') && role !== 'MIETER') {
    return NextResponse.redirect(new URL(`/${locale}/403`, req.url))
  }

  if (internalPath.startsWith('/owner') && role !== 'EIGENTUEMER') {
    return NextResponse.redirect(new URL(`/${locale}/403`, req.url))
  }

  if (internalPath.startsWith('/superadmin') && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL(`/${locale}/403`, req.url))
  }

  if (
    internalPath.startsWith('/dashboard/team') &&
    role !== 'ADMIN' &&
    role !== 'SUPER_ADMIN'
  ) {
    return NextResponse.redirect(new URL(`/${locale}/403`, req.url))
  }

  // Authenticated and authorized → let intl middleware handle locale routing
  return intlMiddleware(req)
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals, static files, and service worker
    '/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|sw\\.js|manifest\\.json|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp|.*\\.ico|.*\\.xml|.*\\.txt|.*\\.woff|.*\\.woff2|.*\\.ttf|.*\\.otf).*)',
  ],
}
