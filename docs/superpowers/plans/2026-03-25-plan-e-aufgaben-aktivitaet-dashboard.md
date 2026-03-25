# Plan E – Aufgaben, Aktivitätsprotokoll & Dashboard Erweiterungen

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Tasks module (Aufgaben & Erinnerungen), Activity Log page, and extend the main dashboard with vacancy rate, open payments KPIs, upcoming lease ends, and unit status management.

**Architecture:** Task CRUD via Server Actions. ActivityLog written centrally via `lib/activity.ts` helper. Dashboard KPIs via parallel Prisma queries.

**Prerequisite:** Plans A1 and A2 complete. Plan B recommended (payment KPIs).

**Tech Stack:** Prisma (Task, ActivityLog, Unit), Server Actions, next-intl, zod

---

## File Map

### New files
- `app/[lang]/dashboard/tasks/page.tsx`
- `app/[lang]/dashboard/tasks/loading.tsx`
- `app/[lang]/dashboard/tasks/_actions.ts`
- `app/[lang]/dashboard/activity/page.tsx`
- `app/[lang]/dashboard/activity/loading.tsx`
- `components/tasks/TaskCard.tsx`
- `components/tasks/TaskForm.tsx`
- `components/tasks/TaskStatusBadge.tsx`
- `lib/activity.ts` — central ActivityLog helper
- `__tests__/lib/activity.test.ts`

### Modified files
- `app/[lang]/dashboard/page.tsx` — add vacancy rate, upcoming lease ends, task widget
- `components/layout/DashboardSidebar.tsx` — add Tasks + Activity nav items
- `components/units/UnitRow.tsx` or `UnitsTable.tsx` — add status selector (VERMIETET/LEER/RENOVIERUNG)
- `app/[lang]/dashboard/properties/[propertyId]/page.tsx` — show vacancy rate per property

---

## Task 1: ActivityLog Helper

**Files:**
- Create: `lib/activity.ts`
- Create: `__tests__/lib/activity.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/activity.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatActivityAction } from '@/lib/activity'

describe('formatActivityAction', () => {
  it('formatiert TENANT_CREATED korrekt', () => {
    const result = formatActivityAction('TENANT_CREATED', { tenantName: 'Hans Muster' })
    expect(result).toContain('Hans Muster')
    expect(result.toLowerCase()).toContain('mieter')
  })

  it('formatiert PAYMENT_RECORDED korrekt', () => {
    const result = formatActivityAction('PAYMENT_RECORDED', { amount: 1500 })
    expect(result).toContain('1500')
  })

  it('gibt Fallback für unbekannte Aktionen zurück', () => {
    const result = formatActivityAction('UNKNOWN_ACTION', {})
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npm test -- __tests__/lib/activity.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create lib/activity.ts**

```ts
// lib/activity.ts — Aktivitätsprotokoll Hilfsfunktionen

import { prisma } from '@/lib/prisma'

type ActivityAction =
  | 'TENANT_CREATED'
  | 'TENANT_DELETED'
  | 'PAYMENT_RECORDED'
  | 'RENT_DEMANDS_GENERATED'
  | 'REMINDER_SENT'
  | 'DOCUMENT_UPLOADED'
  | 'LEASE_CREATED'
  | 'LEASE_ENDED'
  | 'TICKET_CREATED'
  | 'TICKET_RESOLVED'
  | 'EXCEL_IMPORT'
  | 'HANDOVER_WIZARD_STEP_1'
  | 'HANDOVER_WIZARD_STEP_2'
  | 'HANDOVER_WIZARD_STEP_3'
  | 'HANDOVER_WIZARD_STEP_4'
  | 'HANDOVER_WIZARD_STEP_5'
  | string

const actionLabels: Record<string, (meta: Record<string, unknown>) => string> = {
  TENANT_CREATED: (m) => `Mieter angelegt: ${m.tenantName ?? ''}`,
  TENANT_DELETED: (m) => `Mieter gelöscht: ${m.tenantName ?? ''}`,
  PAYMENT_RECORDED: (m) => `Zahlung erfasst: CHF ${m.amount ?? ''}`,
  RENT_DEMANDS_GENERATED: (m) => `${m.created ?? 0} Sollstellungen generiert`,
  REMINDER_SENT: (m) => `Mahnung Stufe ${m.level ?? ''} gesendet`,
  DOCUMENT_UPLOADED: (m) => `Dokument hochgeladen: ${m.name ?? ''}`,
  LEASE_CREATED: (m) => `Mietvertrag erstellt`,
  LEASE_ENDED: (m) => `Mietvertrag beendet`,
  TICKET_CREATED: (m) => `Schadensmeldung erstellt: ${m.title ?? ''}`,
  TICKET_RESOLVED: (m) => `Schadensmeldung erledigt`,
  EXCEL_IMPORT: (m) => `Import: ${m.propertiesCreated ?? 0} Objekte, ${m.tenantsCreated ?? 0} Mieter`,
  HANDOVER_WIZARD_STEP_1: () => 'Mieterwechsel: Schritt 1 (Kündigung)',
  HANDOVER_WIZARD_STEP_2: () => 'Mieterwechsel: Schritt 2 (Nachmieter)',
  HANDOVER_WIZARD_STEP_3: () => 'Mieterwechsel: Schritt 3 (Übergabe)',
  HANDOVER_WIZARD_STEP_4: () => 'Mieterwechsel: Schritt 4 (Kaution)',
  HANDOVER_WIZARD_STEP_5: () => 'Mieterwechsel: Schritt 5 (Neuer Mieter)',
}

/** Formatiert eine Aktion als lesbaren String */
export function formatActivityAction(
  action: ActivityAction,
  metadata: Record<string, unknown>
): string {
  const fn = actionLabels[action]
  if (fn) return fn(metadata)
  return action.replace(/_/g, ' ').toLowerCase()
}

/** Schreibt einen ActivityLog-Eintrag */
export async function logActivity(params: {
  companyId: string
  userId: string
  action: ActivityAction
  entityType: string
  entityId?: string
  metadata?: Record<string, unknown>
}) {
  return prisma.activityLog.create({
    data: {
      companyId: params.companyId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata ?? {},
    },
  })
}
```

- [ ] **Step 4: Run tests — expect green**

```bash
npm test -- __tests__/lib/activity.test.ts
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/activity.ts __tests__/lib/activity.test.ts
git commit -m "feat: add ActivityLog helper with formatting and tests"
```

---

## Task 2: Tasks Server Actions + CRUD

**Files:**
- Create: `app/[lang]/dashboard/tasks/_actions.ts`

- [ ] **Step 1: Create task Server Actions**

Create `app/[lang]/dashboard/tasks/_actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const taskSchema = z.object({
  title: z.string().min(1, 'Titel erforderlich'),
  description: z.string().optional(),
  type: z.enum(['WARTUNG', 'REPARATUR', 'VERTRAGSVERLAENGERUNG', 'BESICHTIGUNG', 'SONSTIGES']),
  dueDate: z.string().datetime(),
  propertyId: z.string().optional(),
  tenantId: z.string().optional(),
  reminderDays: z.number().int().min(0).optional(),
})

export async function createTaskAction(data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  const parsed = taskSchema.parse(data)

  await prisma.task.create({
    data: {
      companyId: session.user.companyId,
      createdById: session.user.id,
      title: parsed.title,
      description: parsed.description,
      type: parsed.type,
      dueDate: new Date(parsed.dueDate),
      status: 'OFFEN',
      propertyId: parsed.propertyId || undefined,
      tenantId: parsed.tenantId || undefined,
      reminderDays: parsed.reminderDays,
    },
  })

  revalidatePath('/dashboard/tasks')
}

export async function updateTaskStatusAction(taskId: string, status: 'OFFEN' | 'IN_BEARBEITUNG' | 'ERLEDIGT') {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  await prisma.task.update({
    where: { id: taskId, companyId: session.user.companyId },
    data: { status },
  })

  revalidatePath('/dashboard/tasks')
}

export async function deleteTaskAction(taskId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  await prisma.task.delete({
    where: { id: taskId, companyId: session.user.companyId },
  })

  revalidatePath('/dashboard/tasks')
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[lang]/dashboard/tasks/_actions.ts
git commit -m "feat: add task CRUD server actions"
```

---

## Task 3: Tasks UI

**Files:**
- Create: `components/tasks/TaskStatusBadge.tsx`
- Create: `components/tasks/TaskCard.tsx`
- Create: `app/[lang]/dashboard/tasks/page.tsx`
- Create: `app/[lang]/dashboard/tasks/loading.tsx`

- [ ] **Step 1: Create TaskStatusBadge**

Create `components/tasks/TaskStatusBadge.tsx`:

```tsx
import { Badge } from '@/components/ui/badge'

type Status = 'OFFEN' | 'IN_BEARBEITUNG' | 'ERLEDIGT'

const variants: Record<Status, 'secondary' | 'default' | 'outline'> = {
  OFFEN: 'secondary',
  IN_BEARBEITUNG: 'default',
  ERLEDIGT: 'outline',
}

const labels: Record<Status, string> = {
  OFFEN: 'Offen',
  IN_BEARBEITUNG: 'In Bearbeitung',
  ERLEDIGT: 'Erledigt',
}

export function TaskStatusBadge({ status }: { status: Status }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}
```

- [ ] **Step 2: Create TaskCard**

Create `components/tasks/TaskCard.tsx`:

```tsx
'use client'

import { TaskStatusBadge } from './TaskStatusBadge'
import { updateTaskStatusAction, deleteTaskAction } from '@/app/[lang]/dashboard/tasks/_actions'
import { Button } from '@/components/ui/button'

type Task = {
  id: string
  title: string
  description: string | null
  type: string
  dueDate: Date
  status: 'OFFEN' | 'IN_BEARBEITUNG' | 'ERLEDIGT'
  propertyName?: string
  tenantName?: string
}

const typeLabels: Record<string, string> = {
  WARTUNG: 'Wartung',
  REPARATUR: 'Reparatur',
  VERTRAGSVERLAENGERUNG: 'Vertragsverlängerung',
  BESICHTIGUNG: 'Besichtigung',
  SONSTIGES: 'Sonstiges',
}

export function TaskCard({ task }: { task: Task }) {
  const isOverdue = task.status !== 'ERLEDIGT' && new Date(task.dueDate) < new Date()

  return (
    <div className={`border rounded-xl p-4 space-y-2 ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{task.title}</p>
          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
        </div>
        <TaskStatusBadge status={task.status} />
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>📋 {typeLabels[task.type] ?? task.type}</span>
        <span>📅 {new Date(task.dueDate).toLocaleDateString('de-CH')}</span>
        {task.propertyName && <span>🏠 {task.propertyName}</span>}
        {task.tenantName && <span>👤 {task.tenantName}</span>}
        {isOverdue && <span className="text-destructive font-medium">⚠ Überfällig</span>}
      </div>
      <div className="flex gap-2 pt-1">
        {task.status === 'OFFEN' && (
          <Button size="sm" variant="outline" onClick={() => updateTaskStatusAction(task.id, 'IN_BEARBEITUNG')}>
            Starten
          </Button>
        )}
        {task.status === 'IN_BEARBEITUNG' && (
          <Button size="sm" onClick={() => updateTaskStatusAction(task.id, 'ERLEDIGT')}>
            Erledigen
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => deleteTaskAction(task.id)}>
          Löschen
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create tasks page**

Create `app/[lang]/dashboard/tasks/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { TaskCard } from '@/components/tasks/TaskCard'
import { getTranslations } from 'next-intl/server'
import type { PageProps } from 'next/types'

export default async function TasksPage({ params }: PageProps<'/[lang]/dashboard/tasks'>) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) redirect('/auth/login')

  const t = await getTranslations('tasks')

  const tasks = await prisma.task.findMany({
    where: { companyId: session.user.companyId },
    include: {
      property: { select: { name: true } },
      tenant: { select: { name: true } },
    },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  })

  const byStatus = {
    OFFEN: tasks.filter(t => t.status === 'OFFEN'),
    IN_BEARBEITUNG: tasks.filter(t => t.status === 'IN_BEARBEITUNG'),
    ERLEDIGT: tasks.filter(t => t.status === 'ERLEDIGT'),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        {/* TODO: "Neue Aufgabe" Dialog — TaskForm */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['OFFEN', 'IN_BEARBEITUNG', 'ERLEDIGT'] as const).map((status) => (
          <div key={status}>
            <h2 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
              {t(`status${status.replace('_', '') as 'Offen' | 'InBearbeitung' | 'Erledigt'}` as never)}
              {' '}
              <span className="text-xs bg-muted rounded-full px-2 py-0.5 ml-1">{byStatus[status].length}</span>
            </h2>
            <div className="space-y-3">
              {byStatus[status].map((task) => (
                <TaskCard
                  key={task.id}
                  task={{
                    ...task,
                    propertyName: task.property?.name,
                    tenantName: task.tenant?.name,
                  }}
                />
              ))}
              {byStatus[status].length === 0 && (
                <p className="text-sm text-muted-foreground italic">Keine Aufgaben</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create loading.tsx**

Create `app/[lang]/dashboard/tasks/loading.tsx`:

```tsx
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
export default function TasksLoading() { return <LoadingSkeleton /> }
```

- [ ] **Step 5: Commit**

```bash
git add app/[lang]/dashboard/tasks/ components/tasks/
git commit -m "feat: add tasks kanban board (Offen/In Bearbeitung/Erledigt)"
```

---

## Task 4: Activity Log Page

**Files:**
- Create: `app/[lang]/dashboard/activity/page.tsx`
- Create: `app/[lang]/dashboard/activity/loading.tsx`

- [ ] **Step 1: Create activity page**

Create `app/[lang]/dashboard/activity/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { formatActivityAction } from '@/lib/activity'
import { getTranslations } from 'next-intl/server'
import type { PageProps } from 'next/types'

export default async function ActivityPage({ params }: PageProps<'/[lang]/dashboard/activity'>) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) redirect('/auth/login')

  const t = await getTranslations('activity')

  const logs = await prisma.activityLog.findMany({
    where: { companyId: session.user.companyId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      {logs.length === 0 ? (
        <p className="text-muted-foreground">Noch keine Aktivitäten aufgezeichnet.</p>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">{t('timestamp')}</th>
                <th className="text-left p-3">{t('user')}</th>
                <th className="text-left p-3">{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('de-CH')}
                  </td>
                  <td className="p-3">{log.user.name}</td>
                  <td className="p-3">
                    {formatActivityAction(log.action, log.metadata as Record<string, unknown>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create loading.tsx**

```tsx
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
export default function ActivityLoading() { return <LoadingSkeleton /> }
```

- [ ] **Step 3: Commit**

```bash
git add app/[lang]/dashboard/activity/
git commit -m "feat: add activity log page"
```

---

## Task 5: Dashboard Erweiterungen (KPIs + Unit Status)

**Files:**
- Modify: `app/[lang]/dashboard/page.tsx`
- Modify: `components/units/UnitRow.tsx`

- [ ] **Step 1: Read current dashboard/page.tsx**

Read `app/[lang]/dashboard/page.tsx`.

- [ ] **Step 2: Add Leerstandsquote + Vertragsenddaten KPIs**

In the dashboard page, add these queries:

```ts
const companyId = session.user.companyId

// Leerstandsquote
const [totalUnits, vacantUnits] = await Promise.all([
  prisma.unit.count({
    where: { property: { companyId } },
  }),
  prisma.unit.count({
    where: { property: { companyId }, status: 'LEER' },
  }),
])
const vacancyRate = totalUnits > 0 ? Math.round((vacantUnits / totalUnits) * 100) : 0

// Vertragsenddaten (nächste 60 Tage)
const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
const upcomingLeaseEnds = await prisma.lease.count({
  where: {
    companyId,
    status: 'ACTIVE',
    endDate: { lte: in60Days, gte: new Date() },
  },
})

// Anstehende Aufgaben
const [tasks7, tasks30] = await Promise.all([
  prisma.task.count({
    where: {
      companyId,
      status: { not: 'ERLEDIGT' },
      dueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    },
  }),
  prisma.task.count({
    where: {
      companyId,
      status: { not: 'ERLEDIGT' },
      dueDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    },
  }),
])
```

Add new KPI cards:
- **Leerstandsquote:** `{vacancyRate}%` — mit farblicher Kennzeichnung (grün < 5%, gelb 5-15%, rot > 15%)
- **Vertragsenddaten:** `{upcomingLeaseEnds}` Verträge laufen in 60 Tagen aus
- **Aufgaben:** `{tasks7}` in 7 Tagen, `{tasks30}` in 30 Tagen

- [ ] **Step 3: Update UnitRow with status selector**

Read `components/units/UnitRow.tsx`. Add a dropdown/select for `status` (VERMIETET / LEER / RENOVIERUNG) that triggers a Server Action to update the unit status.

Create a Server Action in `app/[lang]/dashboard/properties/[propertyId]/_actions.ts` (check if it exists or create):

```ts
export async function updateUnitStatusAction(unitId: string, status: 'VERMIETET' | 'LEER' | 'RENOVIERUNG') {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  await prisma.unit.update({
    where: { id: unitId },
    data: { status },
  })

  revalidatePath('/dashboard/properties')
}
```

In `UnitRow.tsx`, add a `<select>` showing the current status with the 3 options, `onChange` calls the action.

- [ ] **Step 4: Add Tasks/Activity to sidebar**

Read `components/layout/DashboardSidebar.tsx`. Add nav items for:
- `/dashboard/tasks` — icon `CheckSquare`, label `t('nav.tasks')`
- `/dashboard/activity` — icon `Clock`, label `t('nav.activity')`

- [ ] **Step 5: Commit**

```bash
git add app/[lang]/dashboard/page.tsx components/units/UnitRow.tsx components/layout/DashboardSidebar.tsx
git commit -m "feat: extend dashboard with vacancy rate, lease end warnings, task widget + unit status selector"
```

---

## Task 6: Run All Tests + Final Verification

- [ ] **Step 1: Run full test suite**

```bash
cd "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage"
npm test
```

Expected: All tests pass

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Fix any remaining type errors.

- [ ] **Step 3: Start dev server and smoke test**

```bash
npm run dev &
sleep 8
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/de/dashboard/tasks
# Expected: 200 (or 307 if not logged in)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/de/dashboard/activity
kill %1
```

- [ ] **Step 4: Final tag**

```bash
git tag plan-e-complete
git tag v2-extensions-complete
```

---

## Summary

After Plan E:
- ✅ Tasks kanban board (OFFEN / IN_BEARBEITUNG / ERLEDIGT)
- ✅ Activity log page (last 100 entries, per company)
- ✅ Dashboard: Leerstandsquote, Vertragsenddaten, Aufgaben-Widget
- ✅ Unit status selector (VERMIETET / LEER / RENOVIERUNG)
- ✅ All ActivityLog entries written via central `lib/activity.ts`
- ✅ Tests pass

**All 5 plans (A1, A2, B, C, D, E) complete — V2 Extensions implemented.**
