// lib/push.ts
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

function getVapidDetails() {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const email = process.env.VAPID_EMAIL
  if (!publicKey || !privateKey || !email) {
    throw new Error('VAPID keys not configured')
  }
  return { publicKey, privateKey, email }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url: string,
): Promise<void> {
  const { publicKey, privateKey, email } = getVapidDetails()
  webpush.setVapidDetails(email, publicKey, privateKey)

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  if (subscriptions.length === 0) return

  const payload = JSON.stringify({ title, body, url })

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      } catch (err: any) {
        // 410 Gone or 404 = subscription expired → delete it
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
        }
        // All other errors: log silently, don't block the caller
        console.error('[Push] Failed to send to subscription', sub.id, err?.statusCode)
      }
    }),
  )
}
