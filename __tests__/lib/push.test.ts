import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock web-push
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }),
  },
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pushSubscription: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import webpush from 'web-push'
import { prisma } from '@/lib/prisma'
import { sendPushToUser } from '@/lib/push'

describe('sendPushToUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.VAPID_PUBLIC_KEY = 'test-public'
    process.env.VAPID_PRIVATE_KEY = 'test-private'
    process.env.VAPID_EMAIL = 'mailto:test@test.com'
  })

  it('sends push to all subscriptions for a user', async () => {
    const mockSubs = [
      { id: 's1', endpoint: 'https://fcm.example.com/1', p256dh: 'key1', auth: 'auth1' },
      { id: 's2', endpoint: 'https://fcm.example.com/2', p256dh: 'key2', auth: 'auth2' },
    ]
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue(mockSubs as any)

    await sendPushToUser('user123', 'Neue Nachricht', 'Du hast eine neue Nachricht', '/dashboard/messages')

    expect(prisma.pushSubscription.findMany).toHaveBeenCalledWith({
      where: { userId: 'user123' },
    })
    expect(webpush.sendNotification).toHaveBeenCalledTimes(2)
  })

  it('deletes subscription on 410 Gone response', async () => {
    const mockSubs = [
      { id: 's1', endpoint: 'https://fcm.example.com/gone', p256dh: 'key1', auth: 'auth1' },
    ]
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue(mockSubs as any)
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce({ statusCode: 410 })

    await sendPushToUser('user123', 'Test', 'Test', '/')

    expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
      where: { id: 's1' },
    })
  })

  it('does nothing if user has no subscriptions', async () => {
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([])

    await sendPushToUser('user123', 'Test', 'Test', '/')

    expect(webpush.sendNotification).not.toHaveBeenCalled()
  })
})
