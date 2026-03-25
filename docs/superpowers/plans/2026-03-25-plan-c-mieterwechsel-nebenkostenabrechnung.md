# Plan C – Mieterwechsel-Assistent + Nebenkostenabrechnung

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 5-step tenant handover wizard (Mieterwechsel-Assistent) and enhance the utility billing (Nebenkostenabrechnung) with cost items, distribution keys, automatic tenant share calculation, and OR-compliant PDF.

**Architecture:** Wizard state stored in `lease.handoverWizard` JSON. Utility billing enhanced with `costItems`/`tenantShares` JSON fields on `UtilityBill`. Server-side calculation in `lib/utility-billing.ts`.

**Prerequisite:** Plans A1 and A2 complete.

**Tech Stack:** Prisma, Server Actions, @react-pdf/renderer, next-intl, zod

---

## File Map

### New files
- `app/[lang]/dashboard/tenants/[id]/handover-wizard/page.tsx`
- `app/[lang]/dashboard/tenants/[id]/handover-wizard/_actions.ts`
- `components/handover-wizard/WizardStep.tsx`
- `components/handover-wizard/Step1Termination.tsx`
- `components/handover-wizard/Step2Successor.tsx`
- `components/handover-wizard/Step3Handover.tsx`
- `components/handover-wizard/Step4Deposit.tsx`
- `components/handover-wizard/Step5NewTenant.tsx`
- `lib/utility-billing.ts`
- `__tests__/lib/utility-billing.test.ts`

### Modified files
- `app/[lang]/dashboard/billing/page.tsx` — add cost items UI
- `app/[lang]/dashboard/billing/_actions.ts` — update to handle costItems
- `components/billing/BillForm.tsx` — add cost items section
- `app/[lang]/dashboard/tenants/[id]/page.tsx` or tenant list — add "Mieterwechsel" button

---

## Task 1: Utility Billing Calculation Logic

**Files:**
- Create: `lib/utility-billing.ts`
- Create: `__tests__/lib/utility-billing.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/utility-billing.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { calculateTenantShares, type CostItem, type UnitData } from '@/lib/utility-billing'

const units: UnitData[] = [
  { id: 'u1', size: 80, persons: 2, tenantId: 't1', tenantName: 'Anna Müller', akontoTotal: 600 },
  { id: 'u2', size: 60, persons: 1, tenantId: 't2', tenantName: 'Beat Huber', akontoTotal: 450 },
  { id: 'u3', size: 40, persons: 1, tenantId: 't3', tenantName: 'Carla Rossi', akontoTotal: 300 },
]

describe('calculateTenantShares — Verteilschlüssel sqm', () => {
  it('verteilt Kosten korrekt nach m²', () => {
    const costItems: CostItem[] = [
      { name: 'Heizung', amount: 1800, key: 'sqm' }
    ]
    const shares = calculateTenantShares(costItems, units)
    // Gesamt: 80+60+40 = 180m²
    // t1: 80/180 * 1800 = 800
    // t2: 60/180 * 1800 = 600
    // t3: 40/180 * 1800 = 400
    expect(shares.find(s => s.tenantId === 't1')?.totalShare).toBeCloseTo(800)
    expect(shares.find(s => s.tenantId === 't2')?.totalShare).toBeCloseTo(600)
    expect(shares.find(s => s.tenantId === 't3')?.totalShare).toBeCloseTo(400)
  })
})

describe('calculateTenantShares — Verteilschlüssel unit', () => {
  it('verteilt Kosten gleich pro Einheit', () => {
    const costItems: CostItem[] = [
      { name: 'Hauswartskosten', amount: 900, key: 'unit' }
    ]
    const shares = calculateTenantShares(costItems, units)
    // 900 / 3 = 300 pro Einheit
    for (const share of shares) {
      expect(share.totalShare).toBeCloseTo(300)
    }
  })
})

describe('calculateTenantShares — Verteilschlüssel persons', () => {
  it('verteilt Kosten nach Personenzahl', () => {
    const costItems: CostItem[] = [
      { name: 'Wassergebühren', amount: 800, key: 'persons' }
    ]
    const shares = calculateTenantShares(costItems, units)
    // Gesamt: 2+1+1 = 4 Personen
    // t1: 2/4 * 800 = 400
    // t2: 1/4 * 800 = 200
    // t3: 1/4 * 800 = 200
    expect(shares.find(s => s.tenantId === 't1')?.totalShare).toBeCloseTo(400)
    expect(shares.find(s => s.tenantId === 't2')?.totalShare).toBeCloseTo(200)
    expect(shares.find(s => s.tenantId === 't3')?.totalShare).toBeCloseTo(200)
  })
})

describe('calculateTenantShares — Saldo', () => {
  it('berechnet Nachzahlung/Rückerstattung korrekt', () => {
    const costItems: CostItem[] = [
      { name: 'Heizung', amount: 1800, key: 'sqm' }
    ]
    const shares = calculateTenantShares(costItems, units)
    // t1: Anteil 800, Akonto 600 → Nachzahlung 200
    const t1 = shares.find(s => s.tenantId === 't1')!
    expect(t1.balance).toBeCloseTo(200) // positiv = Nachzahlung
    // t2: Anteil 600, Akonto 450 → Nachzahlung 150
    const t2 = shares.find(s => s.tenantId === 't2')!
    expect(t2.balance).toBeCloseTo(150)
  })
})
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npm test -- __tests__/lib/utility-billing.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create lib/utility-billing.ts**

```ts
// lib/utility-billing.ts — Nebenkostenabrechnung Berechnungslogik

export type DistributionKey = 'sqm' | 'unit' | 'persons'

export interface CostItem {
  name: string
  amount: number
  key: DistributionKey
}

export interface UnitData {
  id: string
  size: number       // m²
  persons: number
  tenantId: string
  tenantName: string
  akontoTotal: number // geleistete NK-Akonto-Zahlungen
}

export interface TenantShare {
  tenantId: string
  tenantName: string
  unitId: string
  costBreakdown: Array<{
    name: string
    amount: number   // Gesamtkosten dieser Position
    key: DistributionKey
    share: number    // Anteil dieses Mieters
  }>
  totalShare: number   // Summe aller Anteile
  akontoTotal: number  // Geleistete Akontozahlungen
  balance: number      // positiv = Nachzahlung, negativ = Rückerstattung
}

/**
 * Berechnet den Mieteranteil pro Kostenposition für alle Einheiten.
 * @param costItems — Kostenpositionen mit Betrag und Verteilschlüssel
 * @param units — Einheiten mit m², Personen, Mieter-Infos
 */
export function calculateTenantShares(
  costItems: CostItem[],
  units: UnitData[]
): TenantShare[] {
  const totalSqm = units.reduce((sum, u) => sum + u.size, 0)
  const totalPersons = units.reduce((sum, u) => sum + u.persons, 0)
  const unitCount = units.length

  return units.map((unit) => {
    const costBreakdown = costItems.map((item) => {
      let weight: number
      let total: number

      switch (item.key) {
        case 'sqm':
          weight = totalSqm > 0 ? unit.size / totalSqm : 0
          break
        case 'unit':
          weight = unitCount > 0 ? 1 / unitCount : 0
          break
        case 'persons':
          weight = totalPersons > 0 ? unit.persons / totalPersons : 0
          break
        default:
          weight = 0
      }

      const share = item.amount * weight

      return {
        name: item.name,
        amount: item.amount,
        key: item.key,
        share: Math.round(share * 100) / 100, // auf Rappen runden
      }
    })

    const totalShare = costBreakdown.reduce((sum, b) => sum + b.share, 0)
    const balance = Math.round((totalShare - unit.akontoTotal) * 100) / 100

    return {
      tenantId: unit.tenantId,
      tenantName: unit.tenantName,
      unitId: unit.id,
      costBreakdown,
      totalShare: Math.round(totalShare * 100) / 100,
      akontoTotal: unit.akontoTotal,
      balance,
    }
  })
}
```

- [ ] **Step 4: Run tests — expect green**

```bash
npm test -- __tests__/lib/utility-billing.test.ts
```

Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/utility-billing.ts __tests__/lib/utility-billing.test.ts
git commit -m "feat: add utility billing calculation with distribution keys and tests"
```

---

## Task 2: Update BillForm with Cost Items

**Files:**
- Modify: `components/billing/BillForm.tsx`
- Modify: `app/[lang]/dashboard/billing/_actions.ts`

- [ ] **Step 1: Read current BillForm.tsx and _actions.ts**

Read both files to understand existing structure.

- [ ] **Step 2: Update BillForm to add cost items section**

Add a dynamic cost items section to the form. Each item has: Name (text), Betrag (number), Verteilschlüssel (select: sqm/unit/persons).

Use `useFieldArray` from react-hook-form to manage the dynamic list:

```tsx
import { useFieldArray } from 'react-hook-form'

// In form schema (zod):
const costItemSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  key: z.enum(['sqm', 'unit', 'persons']),
})

const billSchema = z.object({
  // ... existing fields ...
  costItems: z.array(costItemSchema).min(1, 'Mindestens eine Kostenposition erforderlich'),
})

// In component:
const { fields, append, remove } = useFieldArray({ control, name: 'costItems' })
```

Add UI:
- List of cost item rows (name, amount, key dropdown, delete button)
- "+ Kostenposition hinzufügen" button

- [ ] **Step 3: Update _actions.ts to save costItems and calculate shares**

In the billing Server Action, after creating/updating the UtilityBill:

```ts
import { calculateTenantShares } from '@/lib/utility-billing'

// Einheiten des Objekts laden mit m², Personen, aktiven Leases
const units = await prisma.unit.findMany({
  where: { propertyId: bill.propertyId },
  include: {
    leases: {
      where: { status: 'ACTIVE' },
      include: { tenant: { select: { name: true } } },
    },
  },
})

const unitData = units
  .filter(u => u.leases.length > 0)
  .map(u => ({
    id: u.id,
    size: u.size ?? 0,
    persons: 2, // TODO: Personenzahl auf Lease/Unit erfassen
    tenantId: u.leases[0].tenantId,
    tenantName: u.leases[0].tenant.name,
    akontoTotal: u.leases[0].extraCosts * 12, // Jahreszahlung Akonto
  }))

const tenantShares = calculateTenantShares(costItems, unitData)

await prisma.utilityBill.update({
  where: { id: bill.id },
  data: {
    costItems: JSON.stringify(costItems),
    tenantShares: JSON.stringify(tenantShares),
  },
})
```

- [ ] **Step 4: Commit**

```bash
git add components/billing/BillForm.tsx app/[lang]/dashboard/billing/_actions.ts
git commit -m "feat: add cost items and distribution key calculation to utility billing"
```

---

## Task 3: Billing Detail Page — Tenant Shares

**Files:**
- Modify or create: `app/[lang]/dashboard/billing/[id]/page.tsx`

- [ ] **Step 1: Check if billing detail page exists**

```bash
ls "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/[lang]/dashboard/billing/"
```

- [ ] **Step 2: Create or update billing detail page**

Show tenant shares breakdown table:
- Columns: Mieter, Einheit, je Kostenposition (CHF), Gesamt, Akonto, Saldo
- Saldo: grün (Rückerstattung) oder rot (Nachzahlung)
- "PDF exportieren" button → triggers PDF generation

Read tenantShares JSON from DB and render.

- [ ] **Step 3: Commit**

```bash
git add app/[lang]/dashboard/billing/
git commit -m "feat: add tenant shares breakdown to billing detail page"
```

---

## Task 4: Mieterwechsel-Assistent — Wizard Component

**Files:**
- Create: `app/[lang]/dashboard/tenants/[id]/handover-wizard/page.tsx`
- Create: `app/[lang]/dashboard/tenants/[id]/handover-wizard/_actions.ts`
- Create: `components/handover-wizard/WizardStep.tsx`

- [ ] **Step 1: Create WizardStep component**

Create `components/handover-wizard/WizardStep.tsx`:

```tsx
interface WizardStepProps {
  step: number
  currentStep: number
  title: string
  children: React.ReactNode
}

export function WizardStep({ step, currentStep, title, children }: WizardStepProps) {
  const isActive = step === currentStep
  const isCompleted = step < currentStep

  return (
    <div className={`border rounded-xl p-4 ${isActive ? 'border-primary bg-primary/5' : isCompleted ? 'border-green-300 bg-green-50' : 'border-muted opacity-50'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
          ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {isCompleted ? '✓' : step}
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {isActive && <div className="pl-10">{children}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Create wizard Server Actions**

Create `app/[lang]/dashboard/tenants/[id]/handover-wizard/_actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

type WizardState = {
  step1?: { terminationDate: string; confirmed: boolean }
  step2?: { successorStatus: string; notes: string; plannedMoveIn?: string }
  step3?: { handoverId: string; handoverDate: string }
  step4?: { deductions: Array<{ reason: string; amount: number }>; refundAmount: number }
  step5?: { completed: boolean }
  currentStep: number
}

export async function updateWizardStepAction(leaseId: string, step: number, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, companyId: session.user.companyId },
    select: { handoverWizard: true },
  })

  if (!lease) throw new Error('Lease not found')

  const wizard = (lease.handoverWizard as WizardState | null) ?? { currentStep: 1 }
  const stepKey = `step${step}` as keyof WizardState

  const updated: WizardState = {
    ...wizard,
    [stepKey]: data,
    currentStep: Math.max(wizard.currentStep, step + 1),
  }

  await prisma.lease.update({
    where: { id: leaseId },
    data: { handoverWizard: updated as any },
  })

  // ActivityLog
  await prisma.activityLog.create({
    data: {
      companyId: session.user.companyId,
      userId: session.user.id,
      action: `HANDOVER_WIZARD_STEP_${step}`,
      entityType: 'Lease',
      entityId: leaseId,
      metadata: { step },
    },
  })

  revalidatePath(`/dashboard/tenants`)
  return { nextStep: step + 1 }
}
```

- [ ] **Step 3: Create wizard page**

Create `app/[lang]/dashboard/tenants/[id]/handover-wizard/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { WizardStep } from '@/components/handover-wizard/WizardStep'
import { notFound } from 'next/navigation'
import type { PageProps } from 'next/types'

export default async function HandoverWizardPage({
  params,
}: PageProps<'/[lang]/dashboard/tenants/[id]/handover-wizard'>) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) redirect('/auth/login')

  const { id } = await params

  const tenant = await prisma.user.findUnique({
    where: { id, companyId: session.user.companyId },
    include: {
      leases: {
        where: { status: 'ACTIVE' },
        include: {
          unit: { include: { property: true } },
        },
        take: 1,
      },
    },
  })

  if (!tenant || tenant.leases.length === 0) notFound()

  const lease = tenant.leases[0]
  const wizard = (lease.handoverWizard as { currentStep?: number } | null)
  const currentStep = wizard?.currentStep ?? 1

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Mieterwechsel-Assistent</h1>
        <p className="text-muted-foreground">
          {tenant.name} — {lease.unit.property.name}, Einheit {lease.unit.unitNumber}
        </p>
      </div>

      <div className="space-y-3">
        <WizardStep step={1} currentStep={currentStep} title="Kündigung erfassen">
          {/* Step 1 Form — Kündigungsdatum, bestätigt */}
          <form action={async (fd: FormData) => {
            'use server'
            // Server Action inline — lädt Daten und ruft updateWizardStepAction auf
          }}>
            <input type="date" name="terminationDate" className="border rounded px-3 py-2 w-full mb-2" />
            <label className="flex items-center gap-2 mb-3">
              <input type="checkbox" name="confirmed" />
              <span>Kündigung schriftlich erhalten</span>
            </label>
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
              Weiter
            </button>
          </form>
        </WizardStep>

        <WizardStep step={2} currentStep={currentStep} title="Nachmieter">
          <div className="space-y-2">
            <select name="successorStatus" className="border rounded px-3 py-2 w-full">
              <option value="searching">Wird gesucht</option>
              <option value="found">Gefunden</option>
            </select>
            <textarea name="notes" placeholder="Notizen (Interessenten, Besichtigungen...)" className="border rounded px-3 py-2 w-full" rows={3} />
          </div>
        </WizardStep>

        <WizardStep step={3} currentStep={currentStep} title="Wohnungsübergabe planen">
          <p className="text-sm text-muted-foreground mb-2">
            Übergabeprotokoll wird im Handover-Modul erstellt.
          </p>
          <a href="/dashboard/handovers/new" className="text-primary underline">
            → Neues Übergabeprotokoll erstellen
          </a>
        </WizardStep>

        <WizardStep step={4} currentStep={currentStep} title="Kaution abrechnen">
          <div className="space-y-2">
            <p className="text-sm font-medium">Hinterlegte Kaution: CHF {lease.depositAmount ?? '–'}</p>
            <p className="text-sm text-muted-foreground">Mieter-IBAN: {tenant.iban ?? '–'}</p>
            <textarea name="deductions" placeholder="Abzüge (z.B. Reinigung CHF 200, Schaden CHF 150)" className="border rounded px-3 py-2 w-full" rows={2} />
          </div>
        </WizardStep>

        <WizardStep step={5} currentStep={currentStep} title="Neuen Mieter anlegen">
          <p className="text-sm text-muted-foreground mb-2">
            Das Mietverhältnis wird beendet, ein neuer Mieter kann angelegt werden.
          </p>
          <a href={`/dashboard/tenants/new?propertyId=${lease.unit.propertyId}&unitId=${lease.unitId}`}
             className="bg-primary text-white px-4 py-2 rounded inline-block">
            Neuen Mieter anlegen
          </a>
        </WizardStep>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add "Mieterwechsel" button to tenant detail**

Read `app/[lang]/dashboard/tenants/` page or detail. Add a button/link to `/dashboard/tenants/[id]/handover-wizard`.

- [ ] **Step 5: Commit**

```bash
git add app/[lang]/dashboard/tenants/ components/handover-wizard/
git commit -m "feat: add 5-step tenant handover wizard"
```

---

## Task 5: Run All Tests

- [ ] **Step 1: Full test suite**

```bash
npm test
```

Expected: All tests pass

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Tag**

```bash
git tag plan-c-complete
```

---

## Summary

After Plan C:
- ✅ Utility billing with dynamic cost items and distribution keys (sqm/unit/persons)
- ✅ Automatic tenant share calculation with balance (Nachzahlung/Rückerstattung)
- ✅ 5-step Mieterwechsel-Assistent with persisted wizard state
- ✅ All calculation logic covered by unit tests

**Next:** Plan D — Excel-Import Onboarding + CH-Vorlagen
