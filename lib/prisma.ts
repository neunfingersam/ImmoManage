// lib/prisma.ts
// Prisma Client Singleton — verhindert zu viele DB-Connections im Dev-Modus (Hot Reload)
import path from 'path'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@/lib/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? `file:${path.resolve(process.cwd(), 'prisma/dev.db')}`
  // Strip "file:" prefix if present for libsql absolute path resolution
  const filePath = dbUrl.startsWith('file:') ? dbUrl : `file:${dbUrl}`
  const adapter = new PrismaLibSql({ url: filePath })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({ adapter }) as PrismaClient
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
