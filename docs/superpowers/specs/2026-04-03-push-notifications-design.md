# Push Notifications — Design Spec
**Date:** 2026-04-03
**Status:** Approved

## Overview

Add Web Push Notifications to ImmoManage so all user roles (Admin, Vermieter, Mieter, Eigentümer) receive real-time browser push notifications on both mobile and desktop, even when the app tab is closed.

**Approach:** Web Push API with `web-push` npm package and VAPID keys. No external service, no vendor lock-in, no cost.

---

## Architecture

```
Browser/Device
  └── Service Worker (public/sw.js)
        └── receives push event → shows OS notification → click opens app

Client (all portal layouts: dashboard, tenant, owner)
  └── PushBanner component (shown once)
        └── on confirm → registers SW → subscribes → POST /api/push/subscribe
        └── on dismiss → localStorage flag, never shown again

Server (lib/push.ts)
  └── sendPushToUser(userId, title, body, url)
        └── fetches all PushSubscriptions for userId
        └── sends via webpush.sendNotification() with VAPID keys
        └── removes expired/invalid subscriptions automatically

Trigger integration (existing server actions):
  ├── messages/_actions.ts     → sendPushToUser(recipientId, ...)
  ├── tickets/_actions.ts      → sendPushToUser(all admins/vermieter, ...)
  ├── calendar/_actions.ts     → sendPushToUser(affected tenants, ...)
  ├── documents/_actions.ts    → sendPushToUser(target user, ...)
  └── agent/chat/route.ts      → sendPushToUser(vermieter/admin, ...)
```

---

## Database

New Prisma model added to `schema.prisma`:

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

`endpoint` is unique — prevents duplicate subscriptions per device/browser.

---

## Environment Variables

```env
VAPID_PUBLIC_KEY=<generated>
VAPID_PRIVATE_KEY=<generated>
VAPID_EMAIL=mailto:info@immo-manage.ch
```

Generated once with `npx web-push generate-vapid-keys` and added to Vercel env vars.

---

## New Files

| File | Purpose |
|------|---------|
| `public/sw.js` | Service worker: handles `push` event, shows notification, handles `notificationclick` |
| `lib/push.ts` | Server utility: `sendPushToUser(userId, title, body, url)` |
| `app/api/push/subscribe/route.ts` | `POST` saves subscription, `DELETE` removes it |
| `components/layout/PushBanner.tsx` | One-time opt-in banner, dismissible |
| `hooks/usePushSubscription.ts` | Client hook: registers SW, subscribes, calls API |

---

## Service Worker (`public/sw.js`)

Handles two events:
- `push` — parses JSON payload `{ title, body, url }`, calls `self.registration.showNotification()`
- `notificationclick` — closes notification, opens `event.notification.data.url` in focused window or new tab

---

## API Routes

**`POST /api/push/subscribe`**
Body: `{ endpoint, keys: { p256dh, auth } }`
Auth: requires valid session
Action: upsert PushSubscription for current user

**`DELETE /api/push/subscribe`**
Body: `{ endpoint }`
Auth: requires valid session
Action: delete PushSubscription by endpoint

---

## Banner UX

- Shown in all three portal layouts (dashboard, tenant, owner) after login
- Stored dismissal state in `localStorage` key `push_dismissed`
- "Jetzt aktivieren" → requests browser permission → registers SW → subscribes → hides banner
- "Nein" → sets `push_dismissed = true` → hides banner permanently
- If browser permission is denied → hides banner, sets dismissed flag
- Re-enable option in profile settings page (toggle)

---

## Push Triggers

| Event | Trigger location | Recipients |
|-------|-----------------|------------|
| New chat message sent | `messages/_actions.ts` | Message recipient |
| New ticket created | `tickets/_actions.ts` | All Admins + Vermieter of same company |
| Ticket status changed | `tickets/_actions.ts` | Ticket creator |
| New calendar event | `calendar/_actions.ts` | Affected tenant(s) |
| New document shared | `documents/_actions.ts` | Target user |
| AI escalation | `agent/chat/route.ts` | Vermieter/Admin of tenant's company |

---

## Error Handling

- `sendPushToUser` catches per-subscription errors individually — one failed device doesn't block others
- HTTP 410 (Gone) or 404 responses from push service → automatically delete that subscription from DB
- If `web-push` throws, log error silently — push is best-effort, never blocks the main action

---

## Migration

1. `npx prisma migrate dev --name add_push_subscription`
2. For production Turso: `ALTER TABLE` via `turso db shell`
3. Add VAPID env vars to Vercel dashboard

---

## Out of Scope

- Scheduled/batched push reminders (e.g. rent due in 3 days)
- Per-event notification preferences (all or nothing per user)
- iOS native app (PWA push works on iOS 16.4+ via Safari)
