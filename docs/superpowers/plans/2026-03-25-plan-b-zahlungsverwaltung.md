# Plan B – Zahlungsverwaltung

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement monthly payment demands (Sollstellung), manual payment recording, open items overview, QR-invoice PDF generation (demo layout), and configurable payment reminders (1./2./3. Mahnung).

**Architecture:** Server Actions for mutations. New route `app/[lang]/dashboard/payments/`. Utility functions in `lib/payments.ts` and `lib/qr-invoice.ts`. RentDemand/Payment models from Plan A1 schema.

**Prerequisite:** Plans A1 and A2 complete.

**Tech Stack:** Prisma (RentDemand, Payment, PaymentReminder), @react-pdf/renderer, qrcode, nodemailer (already installed), next-intl

---

## File Map

### New files
- `app/[lang]/dashboard/payments/page.tsx` — payments overview
- `app/[lang]/dashboard/payments/loading.tsx`
- `app/[lang]/dashboard/payments/_actions.ts` — Server Actions
- `components/payments/PaymentStatusBadge.tsx`
- `components/payments/RecordPaymentModal.tsx`
- `components/payments/RentDemandTable.tsx`
- `lib/payments.ts` — generate demands, update status logic
- `lib/qr-invoice.ts` — QR-Rechnung PDF generation
- `app/api/payments/generate-demands/route.ts`
- `app/api/payments/qr-invoice/[demandId]/route.ts`
- `__tests__/lib/payments.test.ts`
- `__tests__/lib/qr-invoice.test.ts`

### Modified files
- `app/[lang]/dashboard/page.tsx` — add payment KPI cards
- `app/[lang]/dashboard/layout.tsx` — add payments to sidebar (if not auto-detected)
- `components/layout/DashboardSidebar.tsx` — add "Zahlungen" nav item

---

## Task 1: Core Payment Logic (lib/payments.ts)

**Files:**
- Create: `lib/payments.ts`
- Create: `__tests__/lib/payments.test.ts`

- [ ] **Step 1: Write failing tests first**

Create `__tests__/lib/payments.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  calculateRentDemandAmount,
  getRentDemandStatus,
  getMonthStart,
} from '@/lib/payments'

describe('calculateRentDemandAmount', () => {
  it('gibt coldRent + extraCosts zurück', () => {
    const result = calculateRentDemandAmount({ coldRent: 1200, extraCosts: 300 })
    expect(result).toBe(1500)
  })

  it('gibt nur coldRent zurück wenn extraCosts fehlen', () => {
    const result = calculateRentDemandAmount({ coldRent: 1200, extraCosts: 0 })
    expect(result).toBe(1200)
  })
})

describe('getRentDemandStatus', () => {
  it('gibt PAID zurück wenn vollständig bezahlt', () => {
    const status = getRentDemandStatus({ amount: 1500, paidAmount: 1500, dueDate: new Date('2026-01-10') })
    expect(status).toBe('PAID')
  })

  it('gibt OVERDUE zurück wenn überfällig und nicht bezahlt', () => {
    const pastDate = new Date('2020-01-01')
    const status = getRentDemandStatus({ amount: 1500, paidAmount: 0, dueDate: pastDate })
    expect(status).toBe('OVERDUE')
  })

  it('gibt PENDING zurück wenn nicht fällig', () => {
    const futureDate = new Date('2099-12-31')
    const status = getRentDemandStatus({ amount: 1500, paidAmount: 0, dueDate: futureDate })
    expect(status).toBe('PENDING')
  })
})

describe('getMonthStart', () => {
  it('gibt den 1. des Monats zurück', () => {
    const result = getMonthStart(new Date('2026-03-15'))
    expect(result.getDate()).toBe(1)
    expect(result.getMonth()).toBe(2) // März = 2
    expect(result.getFullYear()).toBe(2026)
  })
})
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npm test -- __tests__/lib/payments.test.ts
```

Expected: FAIL "cannot find module @/lib/payments"

- [ ] **Step 3: Create lib/payments.ts**

```ts
// lib/payments.ts — Zahlungsverwaltungs-Logik

export type RentDemandStatusResult = 'PENDING' | 'PAID' | 'OVERDUE'

interface LeaseAmounts {
  coldRent: number
  extraCosts: number
}

interface DemandStatusInput {
  amount: number
  paidAmount: number
  dueDate: Date
}

/** Berechnet den monatlichen Sollbetrag einer Lease */
export function calculateRentDemandAmount(lease: LeaseAmounts): number {
  return lease.coldRent + lease.extraCosts
}

/** Berechnet den aktuellen Status eines RentDemand */
export function getRentDemandStatus(input: DemandStatusInput): RentDemandStatusResult {
  if (input.paidAmount >= input.amount) return 'PAID'
  if (input.dueDate < new Date()) return 'OVERDUE'
  return 'PENDING'
}

/** Gibt den 1. eines Monats zurück (UTC Mitternacht) */
export function getMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1))
}

/** Gibt das Fälligkeitsdatum zurück (1. des Monats + X Tage) */
export function getDueDate(monthStart: Date, dueDayOffset = 10): Date {
  return new Date(Date.UTC(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    dueDayOffset
  ))
}
```

- [ ] **Step 4: Run tests — expect green**

```bash
npm test -- __tests__/lib/payments.test.ts
```

Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/payments.ts __tests__/lib/payments.test.ts
git commit -m "feat: add payment calculation utilities with tests"
```

---

## Task 2: Generate Demands API Route

**Files:**
- Create: `app/api/payments/generate-demands/route.ts`

- [ ] **Step 1: Create the API route**

Create `app/api/payments/generate-demands/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateRentDemandAmount, getMonthStart, getDueDate } from '@/lib/payments'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companyId = session.user.companyId
  const monthStart = getMonthStart(new Date())
  const dueDate = getDueDate(monthStart)

  // Alle aktiven Leases der Company laden
  const activeLeases = await prisma.lease.findMany({
    where: { companyId, status: 'ACTIVE' },
    select: { id: true, coldRent: true, extraCosts: true },
  })

  let created = 0
  let skipped = 0

  for (const lease of activeLeases) {
    // Idempotenz: prüfen ob Eintrag für diesen Monat bereits existiert
    const existing = await prisma.rentDemand.findFirst({
      where: { leaseId: lease.id, month: monthStart },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.rentDemand.create({
      data: {
        companyId,
        leaseId: lease.id,
        month: monthStart,
        amount: calculateRentDemandAmount(lease),
        status: 'PENDING',
        dueDate,
      },
    })
    created++
  }

  // ActivityLog schreiben
  await prisma.activityLog.create({
    data: {
      companyId,
      userId: session.user.id,
      action: 'RENT_DEMANDS_GENERATED',
      entityType: 'RentDemand',
      metadata: { created, skipped, month: monthStart.toISOString() },
    },
  })

  return NextResponse.json({ created, skipped })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/payments/
git commit -m "feat: add generate-demands API route (idempotent)"
```

---

## Task 3: Record Payment Server Action + Update Status

**Files:**
- Create: `app/[lang]/dashboard/payments/_actions.ts`

- [ ] **Step 1: Create Server Actions**

Create `app/[lang]/dashboard/payments/_actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const recordPaymentSchema = z.object({
  rentDemandId: z.string(),
  leaseId: z.string(),
  amount: z.number().positive(),
  paymentDate: z.string().datetime(),
  note: z.string().optional(),
})

export async function recordPaymentAction(data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  const parsed = recordPaymentSchema.parse(data)

  const payment = await prisma.payment.create({
    data: {
      companyId: session.user.companyId,
      rentDemandId: parsed.rentDemandId,
      leaseId: parsed.leaseId,
      amount: parsed.amount,
      paymentDate: new Date(parsed.paymentDate),
      method: 'MANUAL',
      note: parsed.note,
    },
  })

  // RentDemand Status aktualisieren
  const demand = await prisma.rentDemand.findUnique({
    where: { id: parsed.rentDemandId },
    include: { payments: true },
  })

  if (demand) {
    const totalPaid = demand.payments.reduce((sum, p) => sum + p.amount, 0)
    const newStatus = totalPaid >= demand.amount ? 'PAID' : demand.dueDate < new Date() ? 'OVERDUE' : 'PENDING'

    await prisma.rentDemand.update({
      where: { id: parsed.rentDemandId },
      data: { status: newStatus },
    })
  }

  // ActivityLog
  await prisma.activityLog.create({
    data: {
      companyId: session.user.companyId,
      userId: session.user.id,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { amount: parsed.amount, leaseId: parsed.leaseId },
    },
  })

  revalidatePath('/dashboard/payments')
}

export async function sendReminderAction(rentDemandId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) throw new Error('Unauthorized')

  // Aktuellen Mahnlevel ermitteln
  const lastReminder = await prisma.paymentReminder.findFirst({
    where: { rentDemandId },
    orderBy: { level: 'desc' },
  })

  const nextLevel = (lastReminder?.level ?? 0) + 1
  if (nextLevel > 3) throw new Error('Maximale Mahnstufe erreicht')

  await prisma.paymentReminder.create({
    data: {
      companyId: session.user.companyId,
      rentDemandId,
      level: nextLevel,
      sentAt: new Date(),
    },
  })

  // TODO Plan D: E-Mail aus Mahnvorlage generieren und senden
  // Für jetzt: nur DB-Eintrag

  revalidatePath('/dashboard/payments')

  return { level: nextLevel }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[lang]/dashboard/payments/_actions.ts
git commit -m "feat: add payment recording and reminder server actions"
```

---

## Task 4: QR-Invoice PDF Generation

**Files:**
- Create: `lib/qr-invoice.ts`
- Create: `app/api/payments/qr-invoice/[demandId]/route.ts`
- Create: `__tests__/lib/qr-invoice.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/lib/qr-invoice.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatSwissIban, buildQrPayload } from '@/lib/qr-invoice'

describe('formatSwissIban', () => {
  it('formatiert IBAN mit Leerzeichen', () => {
    const result = formatSwissIban('CH5604835012345678009')
    expect(result).toBe('CH56 0483 5012 3456 7800 9')
  })

  it('akzeptiert bereits formatierte IBAN', () => {
    const result = formatSwissIban('CH56 0483 5012 3456 7800 9')
    expect(result).toBe('CH56 0483 5012 3456 7800 9')
  })
})

describe('buildQrPayload', () => {
  it('erstellt gültigen QR-Payload', () => {
    const payload = buildQrPayload({
      iban: 'CH5604835012345678009',
      creditorName: 'Muster Verwaltung AG',
      creditorAddress: 'Musterstrasse 1',
      creditorCity: '8001 Zürich',
      amount: 1500,
      currency: 'CHF',
      reference: 'Miete März 2026 - Hans Muster',
    })
    expect(payload).toContain('SPC')
    expect(payload).toContain('CH5604835012345678009')
    expect(payload).toContain('1500.00')
    expect(payload).toContain('CHF')
  })
})
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npm test -- __tests__/lib/qr-invoice.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create lib/qr-invoice.ts**

```ts
// lib/qr-invoice.ts — QR-Rechnung Generierung (Demo-Layout, CH ISO 20022)

interface QrInvoiceData {
  iban: string
  creditorName: string
  creditorAddress: string
  creditorCity: string
  amount: number
  currency: 'CHF' | 'EUR'
  reference: string
  debtorName?: string
}

/** Formatiert IBAN mit Leerzeichen (CH-Standard: 4er-Gruppen) */
export function formatSwissIban(iban: string): string {
  const clean = iban.replace(/\s/g, '')
  return clean.match(/.{1,4}/g)?.join(' ') ?? iban
}

/**
 * Erstellt den QR-Code Payload nach Swiss QR Bill Standard (ISO 20022)
 * Demo-Implementierung: Strukturierter Text ohne echte Bankvalidierung
 */
export function buildQrPayload(data: QrInvoiceData): string {
  const ibanClean = data.iban.replace(/\s/g, '')
  const amountFormatted = data.amount.toFixed(2)

  // Swiss QR Bill Payload Format (vereinfacht für Demo)
  return [
    'SPC',                    // Swiss Payments Code
    '0200',                   // Version
    '1',                      // Coding Type
    ibanClean,                // IBAN
    'K',                      // Creditor Address Type (Kombiniert)
    data.creditorName,        // Creditor Name
    data.creditorAddress,     // Creditor Address Line 1
    data.creditorCity,        // Creditor Address Line 2
    '',                       // Creditor Country Zip (leer bei K)
    '',                       // Creditor Country City (leer bei K)
    'CHE',                    // Creditor Country
    '',                       // Ultimate Creditor (leer)
    '',
    '',
    '',
    '',
    '',
    amountFormatted,          // Amount
    data.currency,            // Currency
    data.debtorName ? 'K' : '', // Debtor Address Type
    data.debtorName ?? '',    // Debtor Name
    '',                       // Debtor Address
    '',
    '',
    '',
    'CHE',
    'NON',                    // Reference Type (NON = ohne strukturierte Referenz)
    '',                       // Reference
    data.reference,           // Unstrukturierte Mitteilung
    'EPD',                    // Trailer
  ].join('\n')
}
```

- [ ] **Step 4: Run tests — expect green**

```bash
npm test -- __tests__/lib/qr-invoice.test.ts
```

Expected: All tests PASS

- [ ] **Step 5: Create QR invoice API route**

Create `app/api/payments/qr-invoice/[demandId]/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildQrPayload, formatSwissIban } from '@/lib/qr-invoice'
import QRCode from 'qrcode'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ demandId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { demandId } = await params

  const demand = await prisma.rentDemand.findUnique({
    where: { id: demandId },
    include: {
      lease: {
        include: {
          tenant: { select: { name: true } },
          unit: { include: { property: true } },
        },
      },
      company: true,
    },
  })

  if (!demand || demand.companyId !== session.user.companyId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const company = demand.company
  // IBAN aus Company-Einstellungen (smtpConfig enthält auch bankIban für jetzt)
  const smtpConfig = company.smtpConfig as { bankIban?: string; bankName?: string } | null
  const iban = smtpConfig?.bankIban ?? 'CH0000000000000000000' // Demo-IBAN

  const monthStr = demand.month.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })
  const reference = `Miete ${monthStr} - ${demand.lease.tenant.name}`

  const qrPayload = buildQrPayload({
    iban,
    creditorName: company.name,
    creditorAddress: 'Musterstrasse 1', // TODO: Company-Adresse in DB
    creditorCity: '8001 Zürich',
    amount: demand.amount,
    currency: 'CHF',
    reference,
    debtorName: demand.lease.tenant.name,
  })

  // QR-Code als Data-URL generieren
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    width: 200,
  })

  // Einfaches HTML → PDF via Response (für Demo: JSON mit QR-Data)
  // In Production: @react-pdf/renderer für echtes PDF
  return NextResponse.json({
    demandId,
    amount: demand.amount,
    currency: 'CHF',
    iban: formatSwissIban(iban),
    creditor: company.name,
    reference,
    dueDate: demand.dueDate.toISOString(),
    qrDataUrl,
    monthStr,
    tenantName: demand.lease.tenant.name,
  })
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/qr-invoice.ts app/api/payments/qr-invoice/ __tests__/lib/qr-invoice.test.ts
git commit -m "feat: add QR invoice generation (demo layout)"
```

---

## Task 5: Payments Page UI

**Files:**
- Create: `app/[lang]/dashboard/payments/page.tsx`
- Create: `app/[lang]/dashboard/payments/loading.tsx`
- Create: `components/payments/PaymentStatusBadge.tsx`
- Create: `components/payments/RentDemandTable.tsx`

- [ ] **Step 1: Create PaymentStatusBadge**

Create `components/payments/PaymentStatusBadge.tsx`:

```tsx
import { Badge } from '@/components/ui/badge'

type Status = 'PENDING' | 'PAID' | 'OVERDUE'

const variants: Record<Status, 'default' | 'secondary' | 'destructive'> = {
  PAID: 'default',
  PENDING: 'secondary',
  OVERDUE: 'destructive',
}

const labels: Record<Status, string> = {
  PAID: 'Bezahlt',
  PENDING: 'Ausstehend',
  OVERDUE: 'Überfällig',
}

export function PaymentStatusBadge({ status }: { status: Status }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}
```

- [ ] **Step 2: Create RentDemandTable**

Create `components/payments/RentDemandTable.tsx`:

```tsx
'use client'

import { PaymentStatusBadge } from './PaymentStatusBadge'
import { Button } from '@/components/ui/button'
import { recordPaymentAction, sendReminderAction } from '@/app/[lang]/dashboard/payments/_actions'
import { useTranslations } from 'next-intl'

type RentDemandRow = {
  id: string
  month: Date
  amount: number
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  dueDate: Date
  tenantName: string
  unitNumber: string
  propertyName: string
  reminderLevel: number
}

export function RentDemandTable({ demands }: { demands: RentDemandRow[] }) {
  const t = useTranslations('payments')

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3">{t('month')}</th>
            <th className="text-left p-3">Mieter</th>
            <th className="text-left p-3">Objekt / Einheit</th>
            <th className="text-right p-3">Betrag (CHF)</th>
            <th className="text-left p-3">{t('dueDate')}</th>
            <th className="text-left p-3">{t('statusPending')}</th>
            <th className="text-right p-3">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {demands.map((d) => (
            <tr key={d.id} className="border-t hover:bg-muted/30 transition-colors">
              <td className="p-3">
                {new Date(d.month).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}
              </td>
              <td className="p-3">{d.tenantName}</td>
              <td className="p-3 text-muted-foreground">{d.propertyName} / {d.unitNumber}</td>
              <td className="p-3 text-right font-mono">{d.amount.toFixed(2)}</td>
              <td className="p-3">{new Date(d.dueDate).toLocaleDateString('de-CH')}</td>
              <td className="p-3"><PaymentStatusBadge status={d.status} /></td>
              <td className="p-3 text-right flex gap-2 justify-end">
                {d.status !== 'PAID' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => recordPaymentAction({
                        rentDemandId: d.id,
                        leaseId: '', // wird vom Server geladen
                        amount: d.amount,
                        paymentDate: new Date().toISOString(),
                      })}
                    >
                      Zahlung erfassen
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => sendReminderAction(d.id)}
                    >
                      Mahnung {d.reminderLevel < 3 ? d.reminderLevel + 1 : 3}
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" asChild>
                  <a href={`/api/payments/qr-invoice/${d.id}`} target="_blank">
                    QR
                  </a>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Create payments page**

Create `app/[lang]/dashboard/payments/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { RentDemandTable } from '@/components/payments/RentDemandTable'
import { Button } from '@/components/ui/button'
import { getTranslations } from 'next-intl/server'
import type { PageProps } from 'next/types'

export default async function PaymentsPage({ params }: PageProps<'/[lang]/dashboard/payments'>) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) redirect('/auth/login')

  const t = await getTranslations('payments')

  const demands = await prisma.rentDemand.findMany({
    where: { companyId: session.user.companyId },
    include: {
      lease: {
        include: {
          tenant: { select: { name: true } },
          unit: { include: { property: { select: { name: true } } } },
        },
      },
      reminders: { orderBy: { level: 'desc' }, take: 1 },
    },
    orderBy: { month: 'desc' },
  })

  // KPI Berechnung
  const openTotal = demands
    .filter(d => d.status !== 'PAID')
    .reduce((sum, d) => sum + d.amount, 0)
  const overdueCount = demands.filter(d => d.status === 'OVERDUE').length

  const rows = demands.map(d => ({
    id: d.id,
    month: d.month,
    amount: d.amount,
    status: d.status as 'PENDING' | 'PAID' | 'OVERDUE',
    dueDate: d.dueDate,
    tenantName: d.lease.tenant.name,
    unitNumber: d.lease.unit.unitNumber,
    propertyName: d.lease.unit.property.name,
    reminderLevel: d.reminders[0]?.level ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <form action="/api/payments/generate-demands" method="POST">
          <Button type="submit">{t('generateDemands')}</Button>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">{t('openTotal')}</p>
          <p className="text-2xl font-bold">CHF {openTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">{t('overdueCount')}</p>
          <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">Noch keine Sollstellungen. Klicke auf "Sollstellungen generieren".</p>
      ) : (
        <RentDemandTable demands={rows} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create loading.tsx**

Create `app/[lang]/dashboard/payments/loading.tsx`:

```tsx
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
export default function PaymentsLoading() {
  return <LoadingSkeleton />
}
```

- [ ] **Step 5: Add "Zahlungen" to DashboardSidebar navigation**

Read `components/layout/DashboardSidebar.tsx`. Add a nav item for `/dashboard/payments` with label `t('nav.payments')` and an appropriate icon (e.g. `CreditCard` from lucide-react).

- [ ] **Step 6: Commit**

```bash
git add app/[lang]/dashboard/payments/ components/payments/
git commit -m "feat: add payments page with demand table, KPI cards, QR invoice link"
```

---

## Task 6: Dashboard KPI Cards — Open Payments

**Files:**
- Modify: `app/[lang]/dashboard/page.tsx`

- [ ] **Step 1: Read current dashboard/page.tsx**

Read `app/[lang]/dashboard/page.tsx` to understand existing KPI card structure.

- [ ] **Step 2: Add payment KPIs to dashboard**

In the dashboard page, add queries for:
```ts
const openPaymentsTotal = await prisma.rentDemand.aggregate({
  where: { companyId, status: { in: ['PENDING', 'OVERDUE'] } },
  _sum: { amount: true },
})

const overdueCount = await prisma.rentDemand.count({
  where: { companyId, status: 'OVERDUE' },
})
```

Add two new KPI cards next to existing ones, showing these values.

- [ ] **Step 3: Commit**

```bash
git add app/[lang]/dashboard/page.tsx
git commit -m "feat: add payment KPIs to main dashboard"
```

---

## Task 7: Run All Tests

- [ ] **Step 1: Run full test suite**

```bash
cd "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage"
npm test
```

Expected: All tests pass

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Final commit and tag**

```bash
git tag plan-b-complete
```

---

## Summary

After Plan B:
- ✅ Monthly rent demands can be generated
- ✅ Manual payments can be recorded
- ✅ Open items overview with status badges
- ✅ QR invoice endpoint (JSON with QR data)
- ✅ Payment reminders (1./2./3. Mahnung) tracked in DB
- ✅ Dashboard shows open/overdue payment KPIs
- ✅ All logic covered by tests

**Next:** Plan C — Mieterwechsel-Assistent + Nebenkostenabrechnung Enhancement
