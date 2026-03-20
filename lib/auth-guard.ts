// lib/auth-guard.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function requireCompanyAccess(companyId: string): Promise<void> {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error('Nicht autorisiert')
  }

  if (session.user.role === 'SUPER_ADMIN') {
    return
  }

  if (session.user.companyId !== companyId) {
    throw new Error('Zugriff verweigert')
  }
}
