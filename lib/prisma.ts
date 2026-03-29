// lib/prisma.ts
// Prisma Client Singleton — verhindert zu viele DB-Connections im Dev-Modus (Hot Reload)
import path from 'path'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@/lib/generated/prisma'

// Schema version — bump after every `prisma migrate dev` so stale dev singletons are replaced
const SCHEMA_VERSION = 4

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaVersion: number | undefined
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? `file:${path.resolve(process.cwd(), 'prisma/dev.db')}`
  const authToken = process.env.DATABASE_AUTH_TOKEN
  // Local SQLite: prefix with file:, Turso/remote: use URL as-is with authToken
  const url = dbUrl.startsWith('file:') || dbUrl.startsWith('libsql:') || dbUrl.startsWith('http')
    ? dbUrl
    : `file:${dbUrl}`
  const adapter = new PrismaLibSql({ url, authToken })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({ adapter }) as PrismaClient
}

const needsNewClient =
  !globalForPrisma.prisma || globalForPrisma.prismaVersion !== SCHEMA_VERSION

export const prisma: PrismaClient = needsNewClient
  ? createPrismaClient()
  : globalForPrisma.prisma!

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaVersion = SCHEMA_VERSION
}
