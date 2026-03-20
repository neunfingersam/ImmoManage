import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

import { getServerSession } from 'next-auth'
import { requireCompanyAccess } from '@/lib/auth-guard'

const mockGetServerSession = vi.mocked(getServerSession)

describe('requireCompanyAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sollte Fehler werfen wenn keine Session vorhanden', async () => {
    mockGetServerSession.mockResolvedValue(null)
    await expect(requireCompanyAccess('company-123')).rejects.toThrow('Nicht autorisiert')
  })

  it('sollte SUPER_ADMIN ohne companyId-Prüfung durchlassen', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'u1', role: 'SUPER_ADMIN', companyId: null, name: 'SA', email: 'sa@test.de' },
      expires: '2099-01-01',
    })
    await expect(requireCompanyAccess('irgendeine-company')).resolves.toBeUndefined()
  })

  it('sollte Vermieter mit passender companyId durchlassen', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'u2', role: 'VERMIETER', companyId: 'company-123', name: 'V', email: 'v@test.de' },
      expires: '2099-01-01',
    })
    await expect(requireCompanyAccess('company-123')).resolves.toBeUndefined()
  })

  it('sollte Fehler werfen bei falscher companyId', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'u3', role: 'VERMIETER', companyId: 'company-123', name: 'V', email: 'v@test.de' },
      expires: '2099-01-01',
    })
    await expect(requireCompanyAccess('andere-company')).rejects.toThrow('Zugriff verweigert')
  })
})
