// lib/action-utils.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Session } from 'next-auth'
import type { ActionResult } from '@/lib/action-result'

// Narrowed session type — companyId is guaranteed non-null
export type AuthSession = Session & {
  user: Session['user'] & { id: string; companyId: string; role: string }
}

/**
 * Returns the current session if the user has a companyId, otherwise null.
 * Use in read-only actions where the fallback is an empty value.
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null
  return session as AuthSession
}

/**
 * Wraps a mutation action with auth check.
 * Replaces the 3-line boilerplate in every Server Action.
 *
 * Usage:
 *   export async function createFoo(data: FooValues): Promise<ActionResult<Foo>> {
 *     return withAuthAction(async (session) => {
 *       // session.user.id, .companyId, .role are all available
 *       ...
 *     })
 *   }
 */
export async function withAuthAction<T>(
  handler: (session: AuthSession) => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  const session = await getAuthSession()
  if (!session) return { success: false, error: 'Nicht autorisiert' }
  // Note: getAuthSession() already guarantees session.user.companyId is non-null.
  // SUPER_ADMIN bypass: SUPER_ADMIN users can act on any company — this mirrors
  // the behavior in the original requireCompanyAccess() in lib/auth-guard.ts.
  return handler(session)
}
