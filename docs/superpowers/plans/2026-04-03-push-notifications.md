# Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Web Push Notifications to all user portals (dashboard, tenant, owner) so users receive OS-level push notifications on desktop and mobile when key events occur.

**Architecture:** Install `web-push`, generate VAPID keys, add `PushSubscription` DB model, create a service worker, a server utility `lib/push.ts`, a one-time opt-in banner, and wire push calls into existing server actions.

**Tech Stack:** `web-push` npm package, Next.js App Router Server Actions, Prisma 7 / Turso (libsql), Tailwind CSS, TypeScript, Vitest

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add `web-push` + `@types/web-push` |
| `prisma/schema.prisma` | Modify | Add `PushSubscription` model + User relation |
| `lib/push.ts` | Create | `sendPushToUser(userId, title, body, url)` server utility |
| `app/api/push/subscribe/route.ts` | Create | POST save subscription / DELETE remove it |
| `public/sw.js` | Create | Service worker: handle `push` + `notificationclick` |
| `hooks/usePushSubscription.ts` | Create | Client hook: register SW, subscribe, call API |
| `components/layout/PushBanner.tsx` | Create | One-time opt-in banner with localStorage dismiss |
| `app/[lang]/dashboard/layout.tsx` | Modify | Add `<PushBanner />` |
| `app/[lang]/tenant/layout.tsx` | Modify | Add `<PushBanner />` |
| `app/[lang]/owner/layout.tsx` | Modify | Add `<PushBanner />` |
| `app/[lang]/dashboard/messages/_actions.ts` | Modify | Push to recipient on new message |
| `app/[lang]/tenant/tickets/_actions.ts` | Modify | Push to all admins/vermieter on new ticket |
| `app/[lang]/dashboard/tickets/_actions.ts` | Modify | Push to ticket creator on status change |
| `app/[lang]/dashboard/calendar/_actions.ts` | Modify | Push to affected tenants on new event |
| `app/[lang]/dashboard/documents/_actions.ts` | Modify | Push to target user on document upload |
| `app/api/agent/chat/route.ts` | Modify | Push to vermieter/admin on AI escalation |
| `app/[lang]/tenant/profile/page.tsx` | Modify | Add push disable button |
| `app/[lang]/owner/profile/page.tsx` | Modify | Add push disable button |
| `__tests__/lib/push.test.ts` | Create | Unit tests for `lib/push.ts` |

---

## Task 1: Install web-push

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
cd "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage"
npm install web-push
npm install --save-dev @types/web-push
```

Expected: both packages added to `package.json`

- [ ] **Step 2: Generate VAPID keys**

```bash
npx web-push generate-vapid-keys
```

Expected output (example — your actual keys will differ):
```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

Private Key:
UUxI4O8-HoN...
=======================================
```

- [ ] **Step 3: Add keys to .env.local**

Add these three lines to `.env.local` (replace with your actual generated values):
```env
VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_EMAIL=mailto:info@immo-manage.ch
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(push): install web-push package"
```

---

## Task 2: Add PushSubscription Prisma Model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add model and User relation to schema**

In `prisma/schema.prisma`, add this model at the end of the file:

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

In the `User` model, add the relation line after `emailVerificationTokens`:
```prisma
  pushSubscriptions    PushSubscription[]
```

- [ ] **Step 2: Run local migration**

```bash
npx prisma migrate dev --name add_push_subscription
```

Expected: migration file created, local DB updated

- [ ] **Step 3: Verify generated client**

```bash
npx prisma generate
```

Expected: `lib/generated/prisma/index.ts` regenerated, no errors

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(push): add PushSubscription model"
```

---

## Task 3: Create lib/push.ts

**Files:**
- Create: `lib/push.ts`
- Create: `__tests__/lib/push.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/push.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/push.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/push'`

- [ ] **Step 3: Create lib/push.ts**

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/push.test.ts
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/push.ts __tests__/lib/push.test.ts
git commit -m "feat(push): add sendPushToUser server utility"
```

---

## Task 4: Create /api/push/subscribe Route

**Files:**
- Create: `app/api/push/subscribe/route.ts`

- [ ] **Step 1: Create the route**

Create `app/api/push/subscribe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const body = await req.json()
  const { endpoint, keys } = body as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Ungültige Subscription' }, { status: 400 })
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: session.user.id },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const { endpoint } = await req.json() as { endpoint: string }
  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint fehlt' }, { status: 400 })
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/push/subscribe/route.ts
git commit -m "feat(push): add subscribe/unsubscribe API route"
```

---

## Task 5: Create Service Worker

**Files:**
- Create: `public/sw.js`

- [ ] **Step 1: Create the service worker**

Create `public/sw.js`:

```javascript
// public/sw.js
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const title = data.title || 'ImmoManage'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    }),
  )
})
```

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat(push): add service worker for push events"
```

---

## Task 6: Create usePushSubscription Hook

**Files:**
- Create: `hooks/usePushSubscription.ts`

- [ ] **Step 1: Create the hook**

Create `hooks/usePushSubscription.ts`:

```typescript
'use client'

import { useState, useEffect } from 'react'

export function usePushSubscription() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      // Check if already subscribed
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub)
        })
      })
    }
  }, [])

  async function subscribe(): Promise<boolean> {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return false

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      setSubscribed(true)
      return true
    } catch (err) {
      console.error('[Push] Subscribe failed', err)
      return false
    }
  }

  async function unsubscribe(): Promise<void> {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return

      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })

      await sub.unsubscribe()
      setSubscribed(false)
    } catch (err) {
      console.error('[Push] Unsubscribe failed', err)
    }
  }

  return { supported, subscribed, subscribe, unsubscribe }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}
```

- [ ] **Step 2: Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to .env.local**

In `.env.local`, add (same value as `VAPID_PUBLIC_KEY`):
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-public-key>
```

Also add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to Vercel env vars (same value as `VAPID_PUBLIC_KEY`).

- [ ] **Step 3: Commit**

```bash
git add hooks/usePushSubscription.ts
git commit -m "feat(push): add usePushSubscription client hook"
```

---

## Task 7: Create PushBanner Component

**Files:**
- Create: `components/layout/PushBanner.tsx`

- [ ] **Step 1: Create the banner**

Create `components/layout/PushBanner.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushSubscription } from '@/hooks/usePushSubscription'

const DISMISSED_KEY = 'push_dismissed'

export function PushBanner() {
  const { supported, subscribed, subscribe } = usePushSubscription()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!supported || subscribed) return
    if (localStorage.getItem(DISMISSED_KEY)) return
    // Small delay so it doesn't flash immediately on load
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [supported, subscribed])

  if (!visible) return null

  async function handleAccept() {
    const ok = await subscribe()
    if (ok || Notification.permission === 'denied') {
      dismiss()
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-3">
        <div className="shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">Push-Mitteilungen aktivieren?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Wir benachrichtigen dich bei neuen Nachrichten, Terminen und Meldungen.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAccept}
              className="text-xs bg-primary text-primary-foreground rounded-lg px-3 py-1.5 font-medium hover:bg-primary/90 transition-colors"
            >
              Jetzt aktivieren
            </button>
            <button
              onClick={dismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
            >
              Nein danke
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/PushBanner.tsx
git commit -m "feat(push): add one-time opt-in PushBanner component"
```

---

## Task 8: Add PushBanner to All Portal Layouts

**Files:**
- Modify: `app/[lang]/dashboard/layout.tsx`
- Modify: `app/[lang]/tenant/layout.tsx`
- Modify: `app/[lang]/owner/layout.tsx`

- [ ] **Step 1: Add to dashboard layout**

In `app/[lang]/dashboard/layout.tsx`, add import at top:
```typescript
import { PushBanner } from '@/components/layout/PushBanner'
```

Add `<PushBanner />` just before the closing `</div>` of the root layout element:
```tsx
      <PushBanner />
    </div>
```

- [ ] **Step 2: Add to tenant layout**

In `app/[lang]/tenant/layout.tsx`, add import:
```typescript
import { PushBanner } from '@/components/layout/PushBanner'
```

Add `<PushBanner />` just before the closing tag of the root layout element.

- [ ] **Step 3: Add to owner layout**

In `app/[lang]/owner/layout.tsx`, add import:
```typescript
import { PushBanner } from '@/components/layout/PushBanner'
```

Add `<PushBanner />` just before the closing tag of the root layout element.

- [ ] **Step 4: Commit**

```bash
git add app/\[lang\]/dashboard/layout.tsx app/\[lang\]/tenant/layout.tsx app/\[lang\]/owner/layout.tsx
git commit -m "feat(push): add PushBanner to all portal layouts"
```

---

## Task 9: Wire Push Triggers into Existing Actions

**Files:**
- Modify: `app/[lang]/dashboard/messages/_actions.ts`
- Modify: `app/[lang]/tenant/tickets/_actions.ts`
- Modify: `app/[lang]/dashboard/tickets/_actions.ts`
- Modify: `app/[lang]/dashboard/calendar/_actions.ts`
- Modify: `app/[lang]/dashboard/documents/_actions.ts`
- Modify: `app/api/agent/chat/route.ts`

### 9a — New message → push to recipient

In `app/[lang]/dashboard/messages/_actions.ts`, add import at top:
```typescript
import { sendPushToUser } from '@/lib/push'
```

- [ ] **Step 1: Add push call after message is created**

In `sendMessage()`, after `const message = await prisma.message.create(...)`, add:
```typescript
  // Push notification to recipient
  sendPushToUser(
    parsed.data.toId,
    'Neue Nachricht',
    `${session.user.name ?? 'Jemand'} hat dir eine Nachricht geschickt.`,
    `/dashboard/messages/${session.user.id}`,
  ).catch(() => {})
```

### 9b — New ticket → push to all Admins + Vermieter of the company

In `app/[lang]/tenant/tickets/_actions.ts`, add import at top:
```typescript
import { sendPushToUser } from '@/lib/push'
```

- [ ] **Step 2: Add push call after ticket is created**

In `createTicket()`, after `const ticket = await prisma.ticket.create(...)`, add:
```typescript
    // Push all admins and vermieter of this company
    prisma.user.findMany({
      where: {
        companyId: session.user.companyId,
        role: { in: ['ADMIN', 'VERMIETER'] },
        active: true,
      },
      select: { id: true },
    }).then((staff) => {
      staff.forEach((s) =>
        sendPushToUser(
          s.id,
          'Neue Schadensmeldung',
          `${session.user.name ?? 'Ein Mieter'}: ${parsed.data.title}`,
          `/dashboard/tickets`,
        ).catch(() => {}),
      )
    }).catch(() => {})
```

### 9c — Ticket status change → push to ticket creator

In `app/[lang]/dashboard/tickets/_actions.ts`, add import at top:
```typescript
import { sendPushToUser } from '@/lib/push'
```

- [ ] **Step 3: Read existing updateTicketStatus to find where to add push**

Read lines 59–78 of `app/[lang]/dashboard/tickets/_actions.ts` to find the `ticket` return value, then add after the update call:
```typescript
  // Push ticket creator
  if (ticket.tenantId) {
    sendPushToUser(
      ticket.tenantId,
      'Meldung aktualisiert',
      `Status deiner Meldung "${ticket.title}" wurde auf ${parsed.data.status} geändert.`,
      `/tenant/tickets/${ticket.id}`,
    ).catch(() => {})
  }
```

### 9d — New calendar event → push to affected tenants

In `app/[lang]/dashboard/calendar/_actions.ts`, add import at top:
```typescript
import { sendPushToUser } from '@/lib/push'
```

- [ ] **Step 4: Add push after existing notification creation**

The `createEvent` action already creates `Notification` records for tenants. Find that loop and add a `sendPushToUser` call alongside it:
```typescript
        sendPushToUser(
          tenant.id,
          'Neuer Termin',
          `${data.title} — ${new Date(data.date).toLocaleDateString('de-CH')}`,
          `/tenant/calendar`,
        ).catch(() => {})
```

### 9e — New document → push to target user (when scope=TENANT)

In `app/[lang]/dashboard/documents/_actions.ts`, add import at top:
```typescript
import { sendPushToUser } from '@/lib/push'
```

- [ ] **Step 5: Add push after document is saved**

In `uploadDocument()`, after `prisma.document.create(...)`, add:
```typescript
  if (parsed.data.scope === 'TENANT' && parsed.data.tenantId) {
    sendPushToUser(
      parsed.data.tenantId,
      'Neues Dokument',
      `Ein neues Dokument wurde für Sie bereitgestellt: ${parsed.data.name}`,
      `/tenant/documents`,
    ).catch(() => {})
  }
```

### 9f — AI escalation → push to vermieter/admin

In `app/api/agent/chat/route.ts`, add import at top:
```typescript
import { sendPushToUser } from '@/lib/push'
```

- [ ] **Step 6: Add push alongside existing escalation email**

Find the escalation block (where `sendEscalationEmail` is called) and add:
```typescript
        sendPushToUser(
          staff.id,
          'Mieterfrage weitergeleitet',
          `${tenantName} hat eine Frage gestellt, die beantwortet werden muss.`,
          `/dashboard/messages`,
        ).catch(() => {})
```

- [ ] **Step 7: Commit all trigger changes**

```bash
git add \
  app/\[lang\]/dashboard/messages/_actions.ts \
  app/\[lang\]/tenant/tickets/_actions.ts \
  app/\[lang\]/dashboard/tickets/_actions.ts \
  app/\[lang\]/dashboard/calendar/_actions.ts \
  app/\[lang\]/dashboard/documents/_actions.ts \
  app/api/agent/chat/route.ts
git commit -m "feat(push): wire push notifications into all trigger points"
```

---

## Task 10: Add Push Disable Option to Profile Pages

**Files:**
- Create: `components/layout/PushToggle.tsx`
- Modify: `app/[lang]/tenant/profile/page.tsx`
- Modify: `app/[lang]/owner/profile/page.tsx`

Profile pages are Server Components — PushToggle must be a separate client component file.

- [ ] **Step 1: Create PushToggle client component**

Create `components/layout/PushToggle.tsx`:

```tsx
'use client'

import { usePushSubscription } from '@/hooks/usePushSubscription'

export function PushToggle() {
  const { supported, subscribed, subscribe, unsubscribe } = usePushSubscription()
  if (!supported) return null

  return (
    <div className="flex items-center justify-between py-3 border-t">
      <div>
        <p className="text-sm font-medium">Push-Mitteilungen</p>
        <p className="text-xs text-muted-foreground">
          {subscribed ? 'Aktiv auf diesem Gerät' : 'Deaktiviert auf diesem Gerät'}
        </p>
      </div>
      <button
        onClick={subscribed ? unsubscribe : subscribe}
        className={`text-xs rounded-lg px-3 py-1.5 font-medium transition-colors ${
          subscribed
            ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        }`}
      >
        {subscribed ? 'Deaktivieren' : 'Aktivieren'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Add PushToggle to tenant profile page**

In `app/[lang]/tenant/profile/page.tsx`, add import at top:
```typescript
import { PushToggle } from '@/components/layout/PushToggle'
```

Add `<PushToggle />` inside the profile card, below existing form fields.

- [ ] **Step 3: Add PushToggle to owner profile page**

In `app/[lang]/owner/profile/page.tsx`, add import at top:
```typescript
import { PushToggle } from '@/components/layout/PushToggle'
```

Add `<PushToggle />` inside the profile card, below existing fields.

- [ ] **Step 4: Commit**

```bash
git add components/layout/PushToggle.tsx app/\[lang\]/tenant/profile/page.tsx app/\[lang\]/owner/profile/page.tsx
git commit -m "feat(push): add push enable/disable toggle to profile pages"
```

---

## Task 11: Production Turso Migration

- [ ] **Step 1: Add PushSubscription table to Turso**

```bash
turso db shell immomanage "CREATE TABLE IF NOT EXISTS PushSubscription (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);"
```

Expected: no output (success)

- [ ] **Step 2: Verify table exists**

```bash
turso db shell immomanage "SELECT name FROM sqlite_master WHERE type='table' AND name='PushSubscription';"
```

Expected:
```
NAME
PushSubscription
```

- [ ] **Step 3: Add VAPID env vars to Vercel**

In Vercel Dashboard → Project Settings → Environment Variables, add:
- `VAPID_PUBLIC_KEY` = your public key
- `VAPID_PRIVATE_KEY` = your private key
- `VAPID_EMAIL` = `mailto:info@immo-manage.ch`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = your public key (same as VAPID_PUBLIC_KEY)

- [ ] **Step 4: Final commit and push**

```bash
git add .
git commit -m "feat(push): complete web push notification implementation"
git push
```

---

## Testing Checklist (Manual)

After deployment:
- [ ] Open app in Chrome on desktop → banner appears after ~1.5s → click "Jetzt aktivieren" → browser dialog → accept
- [ ] Send a message from another user → push notification appears on desktop
- [ ] Open app on Android Chrome → same banner flow → send message → push appears on mobile
- [ ] Open app on iOS Safari 16.4+ → banner appears → push works after adding to home screen
- [ ] Click notification → app opens at the correct URL
- [ ] Go to profile → toggle deactivates push on current device
- [ ] Dismiss banner → does not reappear after page reload
