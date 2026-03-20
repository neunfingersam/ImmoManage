// lib/prisma.ts
// Prisma Client Singleton — verhindert zu viele DB-Connections im Dev-Modus (Hot Reload)
import { PrismaClient } from '@/lib/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma 7 requires adapter or accelerateUrl in types, but for SQLite via prisma.config.ts
// the runtime resolves the datasource automatically — we cast to bypass the type constraint
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (PrismaClient as any)()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
