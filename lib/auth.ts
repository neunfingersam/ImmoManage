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
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.companyId = token.companyId
      }
      return session
    },
  },
}
