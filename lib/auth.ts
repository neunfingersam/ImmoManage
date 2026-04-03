// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-Mail', type: 'email' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('E-Mail und Passwort sind erforderlich.')
        }

        const ip = (req as any)?.headers?.['x-forwarded-for'] ?? (req as any)?.socket?.remoteAddress ?? 'unknown'
        const rl = await checkRateLimit(`login:${ip}`)
        if (!rl.allowed) {
          throw new Error('Zu viele Anmeldeversuche. Bitte warte 15 Minuten.')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('E-Mail oder Passwort ist falsch.')
        }

        if (!user.active) {
          throw new Error('Dein Konto wurde deaktiviert.')
        }

        if (!user.emailVerified) {
          throw new Error('Bitte bestätige zuerst deine E-Mail-Adresse. Schau in deinem Posteingang nach der Bestätigungs-E-Mail.')
        }

        const passwordKorrekt = await compare(credentials.password, user.passwordHash)
        if (!passwordKorrekt) {
          throw new Error('E-Mail oder Passwort ist falsch.')
        }

        resetRateLimit(`login:${ip}`)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.companyId = user.companyId
        token.lastChecked = Date.now()
      }

      // Re-validate against DB every 5 minutes — picks up deactivations and role changes
      const RECHECK_MS = 5 * 60 * 1000
      if (token.id && Date.now() - ((token.lastChecked as number) ?? 0) > RECHECK_MS) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { active: true, role: true, companyId: true },
        })
        if (!dbUser || !dbUser.active) {
          // Return deactivated marker — session callback will produce an expired session
          return { ...token, deactivated: true }
        }
        token.role = dbUser.role as string
        token.companyId = dbUser.companyId
        token.lastChecked = Date.now()
      }

      return token
    },
    async session({ session, token }) {
      if ((token as any).deactivated) {
        // Force expiry so getServerSession returns null → protected pages redirect to login
        return { ...session, expires: new Date(0).toISOString() }
      }
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.companyId = token.companyId
      }
      return session
    },
  },
}
