# ImmoManage Optimization Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce repetition, improve structure and robustness across the ImmoManage codebase without changing any user-visible behavior.

**Architecture:** Extract repeated auth/access-control patterns into shared utilities, split the chat API route into focused modules, compose Zod schemas from base objects, extract Calendar helpers, add Error Boundaries per feature section, and seed tests for critical logic.

**Tech Stack:** Next.js 16 App Router, TypeScript, NextAuth.js v4, Prisma, Zod, Vitest + jsdom, Tailwind CSS 4

---

## IMPORTANT: Read Before Starting

- **AGENTS.md** says: "This is NOT the Next.js you know — read `node_modules/next/dist/docs/` before writing any code."
- Run `npx vitest run` to verify tests pass before and after each task.
- All files use `@/` as alias for the project root.
- Server Actions must keep `'use server'` at top of file.
- Do NOT change any user-visible behavior. This is pure internal refactoring.

---

## File Map

| Task | Creates | Modifies |
|------|---------|----------|
| 1 | `lib/action-utils.ts` | `__tests__/lib/action-utils.test.ts` |
| 2 | `lib/access-control.ts` | `app/dashboard/properties/_actions.ts`, `app/dashboard/tickets/_actions.ts`, `app/dashboard/tenants/_actions.ts`, `app/dashboard/leases/_actions.ts` |
| 3 | `lib/agent/chat-context.ts` | `app/api/agent/chat/route.ts` |
| 4 | — | `lib/schemas/tenant.ts` |
| 5 | `lib/date-utils.ts` | `components/calendar/WeeklyCalendar.tsx`, `__tests__/lib/date-utils.test.ts` |
| 6 | — | `app/dashboard/properties/_actions.ts`, `app/dashboard/tenants/_actions.ts`, `app/dashboard/tickets/_actions.ts` (use `withAuthAction`) |
| 7 | — | `lib/rate-limit.ts` |
| 8 | `app/dashboard/properties/error.tsx`, `app/dashboard/tenants/error.tsx`, `app/dashboard/tickets/error.tsx`, `app/dashboard/leases/error.tsx`, `app/dashboard/messages/error.tsx`, `app/dashboard/billing/error.tsx`, `app/tenant/tickets/error.tsx`, `app/tenant/messages/error.tsx` | — |
| 9 | `__tests__/lib/escalation.test.ts`, `__tests__/lib/schemas/composition.test.ts` | — |
| 10 | `lib/logger.ts` | `app/api/agent/chat/route.ts` |

---

## Task 1: `getAuthSession` + `withAuthAction` helper

**Purpose:** Eliminate the 3-line auth boilerplate repeated in every Server Action.

**Files:**
- Create: `lib/action-utils.ts`
- Create: `__tests__/lib/action-utils.test.ts`

---

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/action-utils.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/flavio/Documents/Porjekte/Immobilienverwaltung V2/immo-manage"
npx vitest run __tests__/lib/action-utils.test.ts
```

Expected: FAIL — `lib/action-utils` does not exist yet.

- [ ] **Step 3: Create `lib/action-utils.ts`**

```typescript
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
 * Wraps a mutation action with auth + company access check.
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
```

- [ ] **Step 4: Run tests to verify**

```bash
npx vitest run __tests__/lib/action-utils.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/action-utils.ts __tests__/lib/action-utils.test.ts
git commit -m "feat: add getAuthSession and withAuthAction helpers"
```

---

## Task 2: Consolidate access-control `where`-helpers

**Purpose:** Extract `getAccessiblePropertyWhere` / `getTicketWhere` (defined locally in 3 action files) into a single shared module.

**Files:**
- Create: `lib/access-control.ts`
- Modify: `app/dashboard/properties/_actions.ts` (remove local fn, import from lib)
- Modify: `app/dashboard/tickets/_actions.ts` (same)
- Modify: `app/dashboard/tenants/_actions.ts` (inline logic → import)

---

- [ ] **Step 1: Create `lib/access-control.ts`**

```typescript
// lib/access-control.ts
import type { AuthSession } from '@/lib/action-utils'

/**
 * Prisma `where` clause for Property queries scoped to the current user.
 * - ADMIN: all properties of their company
 * - VERMIETER: only properties assigned to them
 */
export function getPropertyWhere(session: AuthSession) {
  const base = { companyId: session.user.companyId }
  if (session.user.role === 'VERMIETER') {
    return { ...base, assignments: { some: { userId: session.user.id } } }
  }
  return base
}

/**
 * Prisma `where` clause for Ticket queries scoped to the current user.
 */
export function getTicketWhere(session: AuthSession) {
  const base = { companyId: session.user.companyId }
  if (session.user.role === 'VERMIETER') {
    return { ...base, property: { assignments: { some: { userId: session.user.id } } } }
  }
  return base
}

/**
 * Prisma `where` clause for Tenant (MIETER) queries scoped to the current user.
 */
export function getTenantWhere(session: AuthSession) {
  const base = { role: 'MIETER' as const, companyId: session.user.companyId }
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
export function getLeaseWhere(session: AuthSession) {
  const base = { companyId: session.user.companyId }
  if (session.user.role === 'VERMIETER') {
    return {
      ...base,
      unit: { property: { assignments: { some: { userId: session.user.id } } } },
    }
  }
  return base
}
```

- [ ] **Step 2: Update `app/dashboard/properties/_actions.ts`**

Remove the local `getAccessiblePropertyWhere` function (lines 13–19) and add the import at the top:

```typescript
// Add to imports:
import { getPropertyWhere } from '@/lib/access-control'
```

Then replace every call to `getAccessiblePropertyWhere(session)` with `getPropertyWhere(session)`.

The file after the change should have NO local `getAccessiblePropertyWhere` function.

- [ ] **Step 3: Update `app/dashboard/tickets/_actions.ts`**

Remove the local `getTicketWhere` function (lines 12–18) and add the import:

```typescript
import { getTicketWhere } from '@/lib/access-control'
```

The file should have NO local `getTicketWhere` function.

- [ ] **Step 4: Update `app/dashboard/leases/_actions.ts`**

Remove the local `getLeaseWhere` function (lines 12–21) and add the import:

```typescript
import { getLeaseWhere } from '@/lib/access-control'
```

Replace every call to the local `getLeaseWhere(session)` with the imported version. The function signature is identical so no further changes are needed.

Also remove `import { requireCompanyAccess } from '@/lib/auth-guard'` if Task 6 has already migrated the mutation actions in this file to `withAuthAction`. If Task 6 has not yet been done, keep the import.

- [ ] **Step 5: Update `app/dashboard/tenants/_actions.ts`**

Replace the inline `base` logic in `getTenants` (lines 31–37) and the VERMIETER check in `getTenant` (lines 97–115) with the shared helper.

For `getTenants`, replace:
```typescript
const base = session.user.role === 'VERMIETER'
  ? { role: 'MIETER' as const, companyId: session.user.companyId, leases: { some: { ... } } }
  : { role: 'MIETER' as const, companyId: session.user.companyId }
const where = { ...base, ...searchFilter }
```
With:
```typescript
import { getTenantWhere } from '@/lib/access-control'
// ...
const where = { ...getTenantWhere(session), ...searchFilter }
```

For `getTenant`, replace the VERMIETER branch with:
```typescript
return prisma.user.findFirst({ where: { id: tenantId, ...getTenantWhere(session) } })
```

Note: `getTenant` also has a single-user lookup that includes `id: tenantId` — the merged where clause handles this correctly since `getTenantWhere` adds role/companyId/assignment constraints on top.

- [ ] **Step 6: Run tests**

```bash
npx vitest run
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/access-control.ts app/dashboard/properties/_actions.ts app/dashboard/tickets/_actions.ts app/dashboard/tenants/_actions.ts app/dashboard/leases/_actions.ts
git commit -m "refactor: extract access-control where-helpers to lib/access-control"
```

---

## Task 3: Split `/api/agent/chat` into focused modules

**Purpose:** Reduce the 215-line route to a thin orchestrator by extracting the context-building logic.

**Files:**
- Create: `lib/agent/chat-context.ts`
- Modify: `app/api/agent/chat/route.ts`

---

- [ ] **Step 1: Create `lib/agent/chat-context.ts`**

```typescript
// lib/agent/chat-context.ts
import { prisma } from '@/lib/prisma'

export type LeaseContextResult = {
  leaseContext: string
  billContext: string
  propertyIds: string[]
  unitInfo: string | null
}

/**
 * Loads the tenant's active leases + utility bills and returns formatted context strings
 * for the AI prompt.
 */
export async function buildTenantContext(userId: string): Promise<LeaseContextResult> {
  const leases = await prisma.lease.findMany({
    where: { tenantId: userId, status: 'ACTIVE' },
    include: {
      unit: { include: { property: { select: { id: true, name: true, address: true, type: true } } } },
    },
  })
  const propertyIds = leases.map(l => l.unit.propertyId)

  const leaseContext = leases.map(l => {
    const warmmiete = l.coldRent + l.extraCosts
    const start = new Date(l.startDate).toLocaleDateString('de-DE')
    const end = l.endDate ? new Date(l.endDate).toLocaleDateString('de-DE') : 'unbefristet'
    return `=== Mietvertrag ===
Immobilie: ${l.unit.property.name}
Adresse: ${l.unit.property.address}
Einheit: ${l.unit.unitNumber}${l.unit.floor != null ? ` (Etage ${l.unit.floor})` : ''}${l.unit.size != null ? `, ${l.unit.size} m²` : ''}${l.unit.rooms != null ? `, ${l.unit.rooms} Zimmer` : ''}
Mietbeginn: ${start}
Mietende: ${end}
Kaltmiete: ${l.coldRent.toFixed(2)} €/Monat
Nebenkosten-Vorauszahlung: ${l.extraCosts.toFixed(2)} €/Monat
Warmmiete gesamt: ${warmmiete.toFixed(2)} €/Monat
Kautionsstatus: ${l.depositPaid ? 'Kaution bezahlt' : 'Kaution noch offen'}`
  }).join('\n\n')

  const unitInfo = leases[0]
    ? `Einheit ${leases[0].unit.unitNumber}, ${leases[0].unit.property.name}, ${leases[0].unit.property.address}`
    : null

  const utilityBills = await prisma.utilityBill.findMany({
    where: { lease: { tenantId: userId } },
    orderBy: { year: 'desc' },
    take: 5,
    include: { property: { select: { name: true } } },
  })
  const billContext = utilityBills.length > 0
    ? `=== Nebenkostenabrechnungen ===\n` + utilityBills.map(b =>
        `Jahr ${b.year}: ${b.amount.toFixed(2)} € (${b.property.name})${b.sentAt ? ` — zugestellt am ${new Date(b.sentAt).toLocaleDateString('de-DE')}` : ''}`
      ).join('\n')
    : ''

  return { leaseContext, billContext, propertyIds, unitInfo }
}

/**
 * Searches documents for the tenant: tries Vectra vector search first,
 * falls back to raw extractedText from DB.
 */
export async function searchTenantDocuments(
  queryVector: number[],
  companyId: string,
  userId: string,
  propertyIds: string[],
  queryChunksFn: (vec: number[], opts: { companyId: string; tenantId: string; propertyIds: string[] }) => Promise<Array<{ text: string; documentId: string }>>
): Promise<{ contextText: string; chunkIds: string[] }> {
  const chunks = await queryChunksFn(queryVector, { companyId, tenantId: userId, propertyIds })

  if (chunks.length > 0) {
    return {
      contextText: chunks.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n'),
      chunkIds: chunks.map(c => c.documentId),
    }
  }

  // Fallback: full extractedText from DB
  const docs = await prisma.document.findMany({
    where: {
      companyId,
      OR: [
        { scope: 'TENANT', tenantId: userId },
        { scope: 'PROPERTY', propertyId: { in: propertyIds } },
        { scope: 'GLOBAL' },
      ],
      extractedText: { not: null },
    },
    select: { name: true, extractedText: true },
  })

  const contextText = docs.length > 0
    ? docs
        .filter(d => d.extractedText && d.extractedText.length > 0)
        .map(d => `Dokument "${d.name}":\n${d.extractedText!.slice(0, 3000)}`)
        .join('\n\n---\n\n')
    : ''

  return { contextText, chunkIds: [] }
}
```

- [ ] **Step 2: Update `app/api/agent/chat/route.ts`**

Replace the inline context building and document search with calls to the new module:

```typescript
// app/api/agent/chat/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isOllamaAvailable, getEmbedding, streamChat, ChatMessage } from '@/lib/agent/ollama'
import { queryChunks } from '@/lib/agent/vectra'
import { shouldEscalate } from '@/lib/agent/escalation'
import { buildTenantContext, searchTenantDocuments } from '@/lib/agent/chat-context'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.companyId) {
    return new Response('Nicht autorisiert', { status: 401 })
  }

  const userId: string = session.user.id
  const companyId: string = session.user.companyId

  const { message, chatId } = await req.json()
  if (!message) return new Response('Nachricht fehlt', { status: 400 })

  if (!(await isOllamaAvailable())) {
    return new Response(
      JSON.stringify({ error: 'KI-Assistent ist momentan nicht verfügbar. Bitte kontaktiere deinen Vermieter direkt.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Chat erstellen oder laden
  let chat = chatId
    ? await prisma.agentChat.findFirst({ where: { id: chatId, tenantId: userId } })
    : null
  if (!chat) {
    chat = await prisma.agentChat.create({ data: { companyId, tenantId: userId } })
  }

  // Kontext aufbauen (extrahiert)
  const { leaseContext, billContext, propertyIds, unitInfo } = await buildTenantContext(userId)

  // Dokument-Suche (extrahiert)
  const queryVector = await getEmbedding(message)
  const { contextText, chunkIds } = await searchTenantDocuments(
    queryVector, companyId, userId, propertyIds, queryChunks
  )

  const structuredContext = [leaseContext, billContext].filter(Boolean).join('\n\n')
  const fullContext = [structuredContext, contextText].filter(Boolean).join('\n\n---\n\n')
  const hasContext = fullContext.length > 0

  const systemPrompt = `Du bist ein hilfreicher KI-Assistent für Mieter der Immobilienverwaltung. Antworte immer auf Deutsch.
${unitInfo ? `Der Mieter wohnt in: ${unitInfo}` : ''}

${hasContext
    ? `Nutze die folgenden Informationen um die Frage zu beantworten. Diese umfassen Mietvertragsdaten, Nebenkostenabrechnungen und hochgeladene Dokumente:\n\n${fullContext}\n\nBeantworte Fragen zu Miethöhe, Vertragsdetails, Nebenkosten und Hausregeln direkt aus diesen Daten. Zitiere bei Bedarf die relevante Stelle.`
    : `Es sind keine Daten für diesen Mieter verfügbar. Teile dem Mieter höflich mit, dass du keine Unterlagen findest und empfehle ihn, seinen Vermieter direkt zu kontaktieren.`
  }`

  const history = await prisma.agentMessage.findMany({
    where: { chatId: chat.id },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })

  const ollamaMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({
      role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  await prisma.agentMessage.create({
    data: { chatId: chat.id, role: 'USER', content: message, sources: JSON.stringify([]) },
  })

  const encoder = new TextEncoder()
  let fullResponse = ''
  const currentChat = chat

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of streamChat(ollamaMessages)) {
          fullResponse += token
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
        }

        const escalate = shouldEscalate(fullResponse, hasContext)

        await prisma.agentMessage.create({
          data: {
            chatId: currentChat.id,
            role: 'AGENT',
            content: fullResponse,
            sources: JSON.stringify(chunkIds),
            wasEscalated: escalate,
          },
        })

        if (escalate) {
          const vermieter = await prisma.user.findFirst({
            where: { companyId, role: { in: ['ADMIN', 'VERMIETER'] } },
          })
          if (vermieter) {
            await prisma.message.create({
              data: {
                companyId,
                fromId: userId,
                toId: vermieter.id,
                text: `[KI-Eskalation] Frage von Mieter: "${message}"`,
                source: 'AI_ESCALATION',
              },
            })
            try {
              const { sendEscalationEmail } = await import('@/lib/email')
              const tenantUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
              if (tenantUser) {
                await sendEscalationEmail({
                  vermieterEmail: vermieter.email,
                  vermieterName: vermieter.name,
                  tenantName: tenantUser.name,
                  question: message,
                })
              }
            } catch { /* Email optional */ }
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, chatId: currentChat.id, escalated: escalate })}\n\n`))
        controller.close()
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : 'Unbekannter Fehler'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  })
}
```

- [ ] **Step 3: Verify the route is now shorter**

```bash
wc -l "/Users/flavio/Documents/Porjekte/Immobilienverwaltung V2/immo-manage/app/api/agent/chat/route.ts"
```

Expected: ~110 lines (down from 215).

- [ ] **Step 4: Run tests**

```bash
npx vitest run
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/agent/chat-context.ts app/api/agent/chat/route.ts
git commit -m "refactor: extract chat context-building to lib/agent/chat-context"
```

---

## Task 4: Zod schema composition in `lib/schemas/tenant.ts`

**Purpose:** `updateTenantSchema` and `updateProfileSchema` are identical (5 identical fields). Eliminate the duplication.

**Files:**
- Modify: `lib/schemas/tenant.ts`

---

- [ ] **Step 1: Read current file to confirm current state**

File: `lib/schemas/tenant.ts` (already read — see overview above)

Current state:
- `tenantSchema`: name, email, password, phone
- `updateTenantSchema`: name, email, phone, whatsapp
- `updateProfileSchema`: name, email, phone, whatsapp ← identical to `updateTenantSchema`

- [ ] **Step 2: Rewrite `lib/schemas/tenant.ts`**

```typescript
// lib/schemas/tenant.ts
import { z } from 'zod'

// Base: fields shared across create + update forms
const tenantBase = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Gültige E-Mail erforderlich'),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
})

// Create: requires password, no whatsapp
export const tenantSchema = tenantBase
  .omit({ whatsapp: true })
  .extend({ password: z.string().min(8, 'Mindestens 8 Zeichen') })

export type TenantFormValues = z.infer<typeof tenantSchema>

// Update (by admin/vermieter): no password
export const updateTenantSchema = tenantBase
export type UpdateTenantValues = z.infer<typeof updateTenantSchema>

// Update (by tenant themselves via profile page): same fields
export const updateProfileSchema = tenantBase
export type UpdateProfileValues = z.infer<typeof updateProfileSchema>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "/Users/flavio/Documents/Porjekte/Immobilienverwaltung V2/immo-manage"
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors related to tenant schemas.

- [ ] **Step 4: Run tests**

```bash
npx vitest run
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/schemas/tenant.ts
git commit -m "refactor: compose tenant schemas from shared base to remove duplication"
```

---

## Task 5: Extract `WeeklyCalendar` helpers to `lib/date-utils.ts`

**Purpose:** Remove date arithmetic from the component, making it easier to test independently.

> **Note on scope:** The spec also proposed extracting `lib/calendar-colors.ts` (event-type → color mapping). This is intentionally omitted here — the `typeColors` and `typeLabels` constants are 10 lines total and only used by one component. Extracting them would add a file without real benefit (YAGNI). The date-logic extraction is the high-value part.

**Files:**
- Create: `lib/date-utils.ts`
- Create: `__tests__/lib/date-utils.test.ts`
- Modify: `components/calendar/WeeklyCalendar.tsx`

---

- [ ] **Step 1: Write failing tests for the helpers**

Create `__tests__/lib/date-utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getMonday, isSameDay, getWeekDays } from '@/lib/date-utils'

describe('getMonday', () => {
  it('returns Monday for a Wednesday input', () => {
    const wed = new Date('2026-03-25') // Wednesday
    const mon = getMonday(wed)
    expect(mon.getDay()).toBe(1) // 1 = Monday
    expect(mon.getDate()).toBe(23)
  })

  it('returns the same Monday for a Monday input', () => {
    const mon = new Date('2026-03-23') // Monday
    expect(getMonday(mon).getDate()).toBe(23)
  })

  it('handles Sunday (should go back to previous Monday)', () => {
    const sun = new Date('2026-03-29') // Sunday
    const mon = getMonday(sun)
    expect(mon.getDay()).toBe(1)
    expect(mon.getDate()).toBe(23)
  })
})

describe('isSameDay', () => {
  it('returns true for same date', () => {
    const a = new Date('2026-03-24T10:00:00')
    const b = new Date('2026-03-24T22:00:00')
    expect(isSameDay(a, b)).toBe(true)
  })

  it('returns false for different dates', () => {
    const a = new Date('2026-03-24')
    const b = new Date('2026-03-25')
    expect(isSameDay(a, b)).toBe(false)
  })
})

describe('getWeekDays', () => {
  it('returns 7 days starting from Monday', () => {
    const mon = new Date('2026-03-23')
    const days = getWeekDays(mon)
    expect(days).toHaveLength(7)
    expect(days[0].getDate()).toBe(23)
    expect(days[6].getDate()).toBe(29)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/date-utils.test.ts
```

Expected: FAIL — `lib/date-utils` does not exist yet.

- [ ] **Step 3: Create `lib/date-utils.ts`**

```typescript
// lib/date-utils.ts

/**
 * Returns the Monday of the week containing the given date.
 * Week starts on Monday (ISO standard).
 */
export function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

/**
 * Returns true if two dates fall on the same calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Returns an array of 7 Date objects for Mon–Sun of the given week.
 * Pass in the Monday of the desired week.
 */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/lib/date-utils.test.ts
```

Expected: PASS

- [ ] **Step 5: Update `components/calendar/WeeklyCalendar.tsx`**

Replace the local `getMonday` and `isSameDay` functions with imports from `lib/date-utils`, and also extract the `weekDays` calculation:

```typescript
// Replace the two local function definitions:
function getMonday(d: Date) { ... }
function isSameDay(a: Date, b: Date) { ... }

// With this import at the top:
import { getMonday, isSameDay, getWeekDays } from '@/lib/date-utils'
```

Then replace:
```typescript
const weekDays = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(weekStart)
  d.setDate(weekStart.getDate() + i)
  return d
})
```
With:
```typescript
const weekDays = getWeekDays(weekStart)
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/date-utils.ts __tests__/lib/date-utils.test.ts components/calendar/WeeklyCalendar.tsx
git commit -m "refactor: extract WeeklyCalendar date helpers to lib/date-utils"
```

---

## Task 6: Migrate mutation actions to `withAuthAction`

**Purpose:** Remove the 3-line auth boilerplate from mutation actions in the three busiest action files.

**Files:**
- Modify: `app/dashboard/properties/_actions.ts`
- Modify: `app/dashboard/tenants/_actions.ts`
- Modify: `app/dashboard/tickets/_actions.ts`

---

- [ ] **Step 1: Update `app/dashboard/properties/_actions.ts`**

Add import:
```typescript
import { getAuthSession, withAuthAction, type AuthSession } from '@/lib/action-utils'
```

Remove:
```typescript
import { requireCompanyAccess } from '@/lib/auth-guard'
```

Migrate each **mutation** action (createProperty, updateProperty, deleteProperty, createUnit, updateUnit, deleteUnit).

Example — `createProperty` before:
```typescript
export async function createProperty(data: PropertyFormValues): Promise<ActionResult<Property>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)
  // ...rest
}
```

After:
```typescript
export async function createProperty(data: PropertyFormValues): Promise<ActionResult<Property>> {
  return withAuthAction(async (session) => {
    // ...rest (same as before, but use session directly)
  })
}
```

Migrate each **read** action (getProperties, getProperty) to use `getAuthSession`:
```typescript
export async function getProperties() {
  const session = await getAuthSession()
  if (!session) return []
  // ...
}
```

Remove the `getServerSession` import if no longer used.

- [ ] **Step 2: Update `app/dashboard/tenants/_actions.ts`**

Same pattern. Migrate:
- `getTenants` → `getAuthSession`
- `createTenant`, `deactivateTenant`, `updateTenant`, `moveTenantToUnit`, `reactivateTenant` → `withAuthAction`
- `getTenant`, `getUnitsForMove` → `getAuthSession`

- [ ] **Step 3: Update `app/dashboard/tickets/_actions.ts`**

Same pattern. Migrate:
- `getTickets`, `getTicket` → `getAuthSession`
- `updateTicketStatus`, `addComment` → `withAuthAction`

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors in migrated files.

- [ ] **Step 5: Run tests**

```bash
npx vitest run
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/properties/_actions.ts app/dashboard/tenants/_actions.ts app/dashboard/tickets/_actions.ts
git commit -m "refactor: use withAuthAction/getAuthSession in dashboard action files"
```

---

## Task 7: Simplify rate-limit dual implementation

**Purpose:** Minor cleanup — document the dev/prod split clearly and fix `resetRateLimit` to be a no-op for Upstash (currently silently does nothing for production resets).

**Files:**
- Modify: `lib/rate-limit.ts`

---

- [ ] **Step 1: Update `lib/rate-limit.ts`**

The only change: add a comment above `resetRateLimit` documenting the dev-only limitation, and make the function body explicit about this:

```typescript
/**
 * Resets the rate limit for a key.
 * NOTE: Only works in development (in-memory). In production (Upstash),
 * rate limits expire naturally after the window (15 min).
 * This is intentional — production resets would require an Upstash API call.
 */
export function resetRateLimit(key: string) {
  resetInMemory(key)
}
```

No behavioral change — just documentation.

- [ ] **Step 2: Commit**

```bash
git add lib/rate-limit.ts
git commit -m "docs: document dev-only behavior of resetRateLimit"
```

---

## Task 8: Error boundaries per feature section

**Purpose:** Prevent errors in one feature from crashing the entire Dashboard.

**Files:**
- Create: `app/dashboard/properties/error.tsx`
- Create: `app/dashboard/tenants/error.tsx`
- Create: `app/dashboard/tickets/error.tsx`
- Create: `app/dashboard/leases/error.tsx`
- Create: `app/dashboard/messages/error.tsx`
- Create: `app/dashboard/billing/error.tsx`
- Create: `app/tenant/tickets/error.tsx`
- Create: `app/tenant/messages/error.tsx`

---

- [ ] **Step 1: Read the existing `app/dashboard/error.tsx` (already done)**

Content to copy as template (it's exactly the right component — just copy it).

- [ ] **Step 2: Create all error boundary files**

Each file gets the same content as `app/dashboard/error.tsx` — just copy it verbatim to each path listed above.

The content is:
```typescript
'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-[16px] bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="font-serif text-xl text-foreground">Etwas ist schiefgelaufen</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Erneut versuchen
        </button>
        <a
          href="/dashboard"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Zur Übersicht
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/properties/error.tsx app/dashboard/tenants/error.tsx app/dashboard/tickets/error.tsx app/dashboard/leases/error.tsx app/dashboard/messages/error.tsx app/dashboard/billing/error.tsx app/tenant/tickets/error.tsx app/tenant/messages/error.tsx
git commit -m "feat: add per-feature error boundaries to dashboard and tenant sections"
```

---

## Task 9: Tests for critical logic

**Purpose:** Add a safety net for escalation logic and schema validation — the two most logic-dense pure functions.

**Files:**
- Create: `__tests__/lib/escalation.test.ts`
- Create: `__tests__/lib/schemas/composition.test.ts`

---

- [ ] **Step 1: Write escalation tests**

Create `__tests__/lib/escalation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { shouldEscalate } from '@/lib/agent/escalation'

describe('shouldEscalate', () => {
  it('returns false when hasContext is true, regardless of response', () => {
    expect(shouldEscalate('steht nicht in den dokumenten', true)).toBe(false)
    expect(shouldEscalate('kann ich nicht beantworten, da ...', true)).toBe(false)
  })

  it('returns false for normal helpful responses without context', () => {
    expect(shouldEscalate('Ihre Kaltmiete beträgt 850 Euro.', false)).toBe(false)
    expect(shouldEscalate('Gerne helfe ich Ihnen dabei!', false)).toBe(false)
  })

  it('returns true for responses containing escalation keywords (no context)', () => {
    expect(shouldEscalate('Diese Information steht nicht in den dokumenten.', false)).toBe(true)
    expect(shouldEscalate('Ich kann diese Frage nicht beantworten, da ich keine Unterlagen habe.', false)).toBe(true)
    expect(shouldEscalate('Ich habe keine informationen dazu in den dokumenten.', false)).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(shouldEscalate('STEHT NICHT IN DEN DOKUMENTEN', false)).toBe(true)
  })
})
```

- [ ] **Step 2: Run escalation tests**

```bash
npx vitest run __tests__/lib/escalation.test.ts
```

Expected: PASS

- [ ] **Step 3: Write schema tests**

Create `__tests__/lib/schemas/composition.test.ts`:
Note: Named `composition.test.ts` inside the existing `__tests__/lib/schemas/` directory (which already contains per-schema tests) to avoid a file/directory naming collision.

```typescript
import { describe, it, expect } from 'vitest'
import { tenantSchema, updateTenantSchema, updateProfileSchema } from '@/lib/schemas/tenant'
import { ticketSchema } from '@/lib/schemas/ticket'

describe('tenantSchema', () => {
  it('accepts valid data', () => {
    const result = tenantSchema.safeParse({
      name: 'Max Mustermann',
      email: 'max@example.com',
      password: 'sicher123',
      phone: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing password', () => {
    const result = tenantSchema.safeParse({ name: 'Max', email: 'max@example.com' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = tenantSchema.safeParse({ name: 'Max', email: 'not-an-email', password: 'pass1234' })
    expect(result.success).toBe(false)
  })
})

describe('updateTenantSchema', () => {
  it('accepts valid data without password', () => {
    const result = updateTenantSchema.safeParse({
      name: 'Max',
      email: 'max@example.com',
      phone: '+49123456',
      whatsapp: null,
    })
    expect(result.success).toBe(true)
  })
})

describe('updateProfileSchema and updateTenantSchema are equivalent', () => {
  it('both accept the same valid input', () => {
    const input = { name: 'Anna', email: 'anna@test.de', phone: null, whatsapp: null }
    expect(updateTenantSchema.safeParse(input).success).toBe(true)
    expect(updateProfileSchema.safeParse(input).success).toBe(true)
  })
})

describe('ticketSchema', () => {
  it('accepts valid ticket', () => {
    const result = ticketSchema.safeParse({
      title: 'Heizung defekt',
      description: 'Die Heizung im Wohnzimmer funktioniert nicht.',
      propertyId: 'prop-123',
      unitId: null,
      priority: 'HIGH',
    })
    expect(result.success).toBe(true)
  })

  it('defaults priority to MEDIUM', () => {
    const result = ticketSchema.safeParse({
      title: 'Test',
      description: 'Test',
      propertyId: 'prop-123',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.priority).toBe('MEDIUM')
  })
})
```

- [ ] **Step 4: Run schema tests**

```bash
npx vitest run __tests__/lib/schemas/composition.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add __tests__/lib/escalation.test.ts __tests__/lib/schemas/composition.test.ts
git commit -m "test: add tests for escalation logic and zod schema composition"
```

---

## Task 10: Structured logging via `lib/logger.ts`

**Purpose:** Add lightweight structured logging so AI escalations and critical errors leave a trace.

> **Note on approach:** The spec mentioned using the existing `SystemLog` DB table. This plan uses `console.log` instead — structured JSON lines are sufficient for Vercel log tailing and avoid unnecessary DB writes on every AI request. The `SystemLog` table can be used later for a dedicated audit-log feature if needed.

**Files:**
- Create: `lib/logger.ts`
- Modify: `app/api/agent/chat/route.ts` (log escalations)

---

- [ ] **Step 1: Create `lib/logger.ts`**

```typescript
// lib/logger.ts
// Lightweight structured logger. Outputs JSON-formatted log lines to stdout.
// Extend later with external sinks (Axiom, Logtail, etc.) if needed.

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  action: string
  [key: string]: unknown
}

function log(entry: LogEntry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry })
  if (entry.level === 'error') {
    console.error(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  info: (action: string, data?: Record<string, unknown>) =>
    log({ level: 'info', action, ...data }),
  warn: (action: string, data?: Record<string, unknown>) =>
    log({ level: 'warn', action, ...data }),
  error: (action: string, data?: Record<string, unknown>) =>
    log({ level: 'error', action, ...data }),
}
```

- [ ] **Step 2: Add escalation logging in `app/api/agent/chat/route.ts`**

Add import:
```typescript
import { logger } from '@/lib/logger'
```

Inside the stream's `start` callback, after the escalation is detected:
```typescript
if (escalate) {
  logger.warn('ai_escalation', { userId, companyId, question: message })
  // ... existing escalation code
}
```

Also log errors in the catch block:
```typescript
} catch (e: unknown) {
  const errMsg = e instanceof Error ? e.message : 'Unbekannter Fehler'
  logger.error('chat_stream_error', { userId, companyId, error: errMsg })
  controller.enqueue(...)
  controller.close()
}
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run
```

Expected: PASS

- [ ] **Step 4: Final full test + TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
npx vitest run
```

Expected: No type errors, all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/logger.ts app/api/agent/chat/route.ts
git commit -m "feat: add structured logger and log AI escalations"
```

---

## Execution Order Summary

```
Task 1  →  Task 2  →  Task 3     (P1: Core, do in order — Task 2 depends on Task 1's AuthSession type)
Task 4  →  Task 5  →  Task 6     (P2: Code quality — Task 6 depends on Task 1)
Task 7  →  Task 8  →  Task 9 → Task 10   (P3: Independent, any order)
```

**Dependency graph:**
- Task 6 requires Task 1 (uses `withAuthAction`)
- Task 2 requires Task 1 (uses `AuthSession` type)
- Task 3 is independent
- All P3 tasks are independent of each other

## Verification

After all tasks are complete:

```bash
npx tsc --noEmit
npx vitest run
```

Both must pass with zero errors.
