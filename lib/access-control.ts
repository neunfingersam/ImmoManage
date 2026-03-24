// lib/access-control.ts

// Accepts both the full AuthSession (from getAuthSession) and the raw Session (from getServerSession).
// companyId is asserted non-null: callers must check !session?.user?.companyId before calling these.
type ScopedSession = {
  user: { role: string; id: string; companyId: string | null }
}

/**
 * Prisma `where` clause for Property queries scoped to the current user.
 * - ADMIN: all properties of their company
 * - VERMIETER: only properties assigned to them
 */
export function getPropertyWhere(session: ScopedSession) {
  const base = { companyId: session.user.companyId! }
  if (session.user.role === 'VERMIETER') {
    return { ...base, assignments: { some: { userId: session.user.id } } }
  }
  return base
}

/**
 * Prisma `where` clause for Ticket queries scoped to the current user.
 */
export function getTicketWhere(session: ScopedSession) {
  const base = { companyId: session.user.companyId! }
  if (session.user.role === 'VERMIETER') {
    return { ...base, property: { assignments: { some: { userId: session.user.id } } } }
  }
  return base
}

/**
 * Prisma `where` clause for Tenant (MIETER) queries scoped to the current user.
 */
export function getTenantWhere(session: ScopedSession) {
  const base = { role: 'MIETER' as const, companyId: session.user.companyId! }
  if (session.user.role === 'VERMIETER') {
    return {
      ...base,
      leases: {
        some: {
          status: 'ACTIVE' as const,
          unit: { property: { assignments: { some: { userId: session.user.id } } } },
        },
      },
    }
  }
  return base
}

/**
 * Prisma `where` clause for Lease queries scoped to the current user.
 */
export function getLeaseWhere(session: ScopedSession) {
  const base = { companyId: session.user.companyId! }
  if (session.user.role === 'VERMIETER') {
    return {
      ...base,
      unit: { property: { assignments: { some: { userId: session.user.id } } } },
    }
  }
  return base
}
