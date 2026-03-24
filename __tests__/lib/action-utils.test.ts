import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next-auth before importing the module under test
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { getServerSession } from 'next-auth'
import { getAuthSession, withAuthAction } from '@/lib/action-utils'

const mockGetServerSession = vi.mocked(getServerSession)

const validSession = {
  user: { id: 'user-1', companyId: 'company-1', role: 'ADMIN', name: 'Test', email: 'test@test.com' },
  expires: '2099-01-01',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getAuthSession', () => {
  it('returns null when session has no companyId', async () => {
    mockGetServerSession.mockResolvedValue(null)
    expect(await getAuthSession()).toBeNull()
  })

  it('returns the session when companyId is present', async () => {
    mockGetServerSession.mockResolvedValue(validSession as any)
    const session = await getAuthSession()
    expect(session?.user.companyId).toBe('company-1')
  })
})

describe('withAuthAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const result = await withAuthAction(async () => ({ success: true, data: 'x' }))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Nicht autorisiert')
  })

  it('calls handler with session when authenticated', async () => {
    mockGetServerSession.mockResolvedValue(validSession as any)
    const result = await withAuthAction(async (session) => ({
      success: true,
      data: session.user.companyId,
    }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe('company-1')
  })
})
