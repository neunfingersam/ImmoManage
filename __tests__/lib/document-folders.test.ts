import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    documentFolder: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { ensurePersonalFolderForUser } from '@/lib/document-folders'

const mockFindFirst = vi.mocked(prisma.documentFolder.findFirst)
const mockCreate = vi.mocked(prisma.documentFolder.create)

describe('ensurePersonalFolderForUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('gibt bestehenden Ordner zurück ohne neu zu erstellen', async () => {
    const existing = { id: 'folder-1', ownerId: 'user-1', propertyId: 'prop-1', type: 'PERSONAL' }
    mockFindFirst.mockResolvedValue(existing as any)

    const result = await ensurePersonalFolderForUser('user-1', 'prop-1', 'company-1', 'Max Muster')

    expect(result).toEqual(existing)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('erstellt neuen Ordner wenn keiner existiert', async () => {
    mockFindFirst.mockResolvedValue(null)
    const created = { id: 'folder-new', ownerId: 'user-2', propertyId: 'prop-1', type: 'PERSONAL' }
    mockCreate.mockResolvedValue(created as any)

    const result = await ensurePersonalFolderForUser('user-2', 'prop-1', 'company-1', 'Anna Meier')

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        companyId: 'company-1',
        propertyId: 'prop-1',
        ownerId: 'user-2',
        type: 'PERSONAL',
        name: 'Persönliche Dokumente — Anna Meier',
        isSystem: true,
      },
    })
    expect(result).toEqual(created)
  })
})
