# Tenant Management & KI Scope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mieter-Detailseite (Edit + Umziehen), Tenant-Selfservice-Profil und role-basierter KI-Scope für Admin/Vermieter.

**Architecture:** Bestehende Server-Action-Pattern beibehalten. Neue Detailseite unter `/dashboard/tenants/[id]` mit zwei Client-Komponenten. Tenant-Selfservice unter `/tenant/profile`. KI-Fix in `vectra.ts` + `admin-chat` route ohne neue Seiten.

**Tech Stack:** Next.js 16, Prisma/libSQL, next-auth, zod, react-hook-form, Tailwind, Vitest

---

## File Map

**Geändert:**
- `lib/schemas/tenant.ts` — `updateTenantSchema`, `updateProfileSchema` hinzufügen
- `app/dashboard/tenants/_actions.ts` — `getTenant`, `updateTenant`, `getUnitsForMove`, `moveTenantToUnit`
- `components/tenants/TenantCard.tsx` — Link zur Detailseite
- `components/layout/TenantSidebar.tsx` — „Mein Profil" Nav-Eintrag
- `lib/agent/vectra.ts` — role-basierter RAG-Filter
- `app/api/agent/admin-chat/route.ts` — VERMIETER-Scope-Filter

**Neu:**
- `app/dashboard/tenants/[id]/page.tsx` — Detailseite (Server Component)
- `app/dashboard/tenants/[id]/TenantEditForm.tsx` — Edit-Formular (Client)
- `app/dashboard/tenants/[id]/MoveUnitDialog.tsx` — Umzug-Dialog (Client)
- `app/tenant/profile/page.tsx` — Profil-Seite Mieter (Server Component)
- `app/tenant/profile/_actions.ts` — `updateProfile` Server Action

---

## Task 1: Schemas erweitern

**Files:**
- Modify: `lib/schemas/tenant.ts`

- [ ] **Step 1: updateTenantSchema + updateProfileSchema hinzufügen**

```ts
// Ergänze in lib/schemas/tenant.ts nach dem bestehenden tenantSchema:

export const updateTenantSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Gültige E-Mail erforderlich'),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
})
export type UpdateTenantValues = z.infer<typeof updateTenantSchema>

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Gültige E-Mail erforderlich'),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
})
export type UpdateProfileValues = z.infer<typeof updateProfileSchema>
```

---

## Task 2: Server Actions — getTenant, updateTenant

**Files:**
- Modify: `app/dashboard/tenants/_actions.ts`

- [ ] **Step 1: `getTenant` Action hinzufügen**

Am Ende der Datei ergänzen:

```ts
export async function getTenant(tenantId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  // VERMIETER darf nur Mieter mit aktivem Lease auf zugewiesenem Property sehen
  if (session.user.role === 'VERMIETER') {
    const tenant = await prisma.user.findFirst({
      where: {
        id: tenantId,
        companyId: session.user.companyId,
        role: 'MIETER',
        leases: {
          some: {
            status: 'ACTIVE',
            unit: { property: { assignments: { some: { userId: session.user.id } } } },
          },
        },
      },
    })
    return tenant
  }

  return prisma.user.findFirst({
    where: { id: tenantId, companyId: session.user.companyId, role: 'MIETER' },
  })
}
```

- [ ] **Step 2: `updateTenant` Action hinzufügen**

```ts
import { updateTenantSchema, type UpdateTenantValues } from '@/lib/schemas/tenant'

export async function updateTenant(tenantId: string, data: UpdateTenantValues): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)

  const parsed = updateTenantSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

  // Zugriffsprüfung: VERMIETER darf nur eigene Mieter bearbeiten
  const tenant = await getTenant(tenantId)
  if (!tenant) return { success: false, error: 'Mieter nicht gefunden' }

  // E-Mail-Uniqueness prüfen (nur wenn geändert)
  if (parsed.data.email !== tenant.email) {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (existing) return { success: false, error: 'E-Mail bereits vergeben' }
  }

  await prisma.user.update({
    where: { id: tenantId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      whatsapp: parsed.data.whatsapp ?? null,
    },
  })
  revalidatePath('/dashboard/tenants')
  revalidatePath(`/dashboard/tenants/${tenantId}`)
  return { success: true, data: undefined }
}
```

---

## Task 3: Server Actions — getUnitsForMove, moveTenantToUnit

**Files:**
- Modify: `app/dashboard/tenants/_actions.ts`

- [ ] **Step 1: `getUnitsForMove` hinzufügen**

```ts
export async function getUnitsForMove(tenantId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return []

  const propertyWhere =
    session.user.role === 'VERMIETER'
      ? { companyId: session.user.companyId, assignments: { some: { userId: session.user.id } } }
      : { companyId: session.user.companyId }

  const properties = await prisma.property.findMany({
    where: propertyWhere,
    include: {
      units: {
        include: {
          leases: { where: { status: 'ACTIVE' }, select: { id: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Nur freie Einheiten (keine aktive Lease) zurückgeben
  return properties.map(p => ({
    propertyId: p.id,
    propertyName: p.name,
    units: p.units
      .filter(u => u.leases.length === 0)
      .map(u => ({ unitId: u.id, unitNumber: u.unitNumber, floor: u.floor })),
  })).filter(p => p.units.length > 0)
}
```

- [ ] **Step 2: `moveTenantToUnit` hinzufügen**

```ts
export async function moveTenantToUnit(tenantId: string, newUnitId: string): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }
  await requireCompanyAccess(session.user.companyId)

  // Zugriff prüfen
  const tenant = await getTenant(tenantId)
  if (!tenant) return { success: false, error: 'Mieter nicht gefunden' }

  // Aktiven Lease des Mieters laden
  const currentLease = await prisma.lease.findFirst({
    where: { tenantId, status: 'ACTIVE' },
  })
  if (!currentLease) return { success: false, error: 'Kein aktiver Mietvertrag gefunden' }

  // Neue Einheit validieren: muss zu zugänglichem Property gehören und frei sein
  const newUnit = await prisma.unit.findFirst({
    where: {
      id: newUnitId,
      property: session.user.role === 'VERMIETER'
        ? { companyId: session.user.companyId, assignments: { some: { userId: session.user.id } } }
        : { companyId: session.user.companyId },
    },
  })
  if (!newUnit) return { success: false, error: 'Einheit nicht gefunden oder kein Zugriff' }

  const activeLease = await prisma.lease.count({ where: { unitId: newUnitId, status: 'ACTIVE' } })
  if (activeLease > 0) return { success: false, error: 'Einheit ist bereits belegt' }

  // Alten Lease beenden, neuen erstellen
  await prisma.lease.update({
    where: { id: currentLease.id },
    data: { status: 'ENDED', endDate: new Date() },
  })
  await prisma.lease.create({
    data: {
      unitId: newUnitId,
      tenantId,
      companyId: session.user.companyId,
      startDate: new Date(),
      coldRent: currentLease.coldRent,
      extraCosts: currentLease.extraCosts,
      depositPaid: currentLease.depositPaid,
      status: 'ACTIVE',
    },
  })

  revalidatePath('/dashboard/tenants')
  revalidatePath(`/dashboard/tenants/${tenantId}`)
  revalidatePath('/dashboard/leases')
  return { success: true, data: undefined }
}
```

---

## Task 4: TenantEditForm Component

**Files:**
- Create: `app/dashboard/tenants/[id]/TenantEditForm.tsx`

- [ ] **Step 1: Formular erstellen**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateTenantSchema, type UpdateTenantValues } from '@/lib/schemas/tenant'
import { updateTenant } from '../_actions'
import type { User } from '@/lib/generated/prisma'

export function TenantEditForm({ tenant }: { tenant: User }) {
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateTenantValues>({
    resolver: zodResolver(updateTenantSchema) as any,
    defaultValues: {
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone ?? '',
      whatsapp: tenant.whatsapp ?? '',
    },
  })

  function onSubmit(data: UpdateTenantValues) {
    setServerError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updateTenant(tenant.id, data)
      if (result.success) {
        setSuccess(true)
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message as string}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" {...register('phone')} placeholder="+49 123 456789" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input id="whatsapp" {...register('whatsapp')} placeholder="+49 123 456789" />
      </div>
      {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}
      {success && <p className="text-sm text-green-600">Gespeichert.</p>}
      <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
        {pending ? 'Wird gespeichert…' : 'Speichern'}
      </Button>
    </form>
  )
}
```

---

## Task 5: MoveUnitDialog Component

**Files:**
- Create: `app/dashboard/tenants/[id]/MoveUnitDialog.tsx`

- [ ] **Step 1: Dialog erstellen**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { moveTenantToUnit } from '../_actions'

type PropertyOption = {
  propertyId: string
  propertyName: string
  units: { unitId: string; unitNumber: string; floor: number | null }[]
}

export function MoveUnitDialog({
  tenantId,
  tenantName,
  options,
}: {
  tenantId: string
  tenantName: string
  options: PropertyOption[]
}) {
  const [open, setOpen] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const selectedProperty = options.find(p => p.propertyId === selectedPropertyId)

  function handlePropertyChange(val: string) {
    setSelectedPropertyId(val)
    setSelectedUnitId('')
  }

  function handleConfirm() {
    if (!selectedUnitId) return
    setError(null)
    startTransition(async () => {
      const result = await moveTenantToUnit(tenantId, selectedUnitId)
      if (result.success) {
        setOpen(false)
      } else {
        setError(result.error)
      }
    })
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Mieter umziehen
      </Button>
    )
  }

  return (
    <div className="space-y-4 rounded-md border p-4 bg-secondary/30 max-w-lg">
      <p className="text-sm font-medium">Neue Einheit für {tenantName} wählen</p>
      <div className="space-y-1">
        <Label>Objekt</Label>
        <Select onValueChange={handlePropertyChange}>
          <SelectTrigger><SelectValue placeholder="Objekt wählen…" /></SelectTrigger>
          <SelectContent>
            {options.map(p => (
              <SelectItem key={p.propertyId} value={p.propertyId}>{p.propertyName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedProperty && (
        <div className="space-y-1">
          <Label>Einheit</Label>
          <Select onValueChange={setSelectedUnitId}>
            <SelectTrigger><SelectValue placeholder="Einheit wählen…" /></SelectTrigger>
            <SelectContent>
              {selectedProperty.units.map(u => (
                <SelectItem key={u.unitId} value={u.unitId}>
                  {u.unitNumber}{u.floor != null ? ` (Etage ${u.floor})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          onClick={handleConfirm}
          disabled={!selectedUnitId || pending}
          className="bg-primary hover:bg-primary/90"
        >
          {pending ? 'Wird verschoben…' : 'Bestätigen'}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Abbrechen
        </Button>
      </div>
    </div>
  )
}
```

---

## Task 6: Tenant Detailseite

**Files:**
- Create: `app/dashboard/tenants/[id]/page.tsx`

- [ ] **Step 1: Seite erstellen**

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTenant, getUnitsForMove } from '../_actions'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TenantEditForm } from './TenantEditForm'
import { MoveUnitDialog } from './MoveUnitDialog'

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return null

  const [tenant, unitsForMove] = await Promise.all([
    getTenant(id),
    getUnitsForMove(id),
  ])

  if (!tenant) notFound()

  const activeLease = await prisma.lease.findFirst({
    where: { tenantId: id, status: 'ACTIVE' },
    include: {
      unit: { include: { property: { select: { name: true } } } },
    },
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button render={<Link href="/dashboard/tenants" />} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück
        </Button>
        <div>
          <h1 className="font-serif text-2xl text-foreground">{tenant.name}</h1>
          {!tenant.active && <Badge variant="destructive" className="text-xs">Inaktiv</Badge>}
        </div>
      </div>

      {/* Aktueller Mietvertrag */}
      {activeLease && (
        <Card className="p-4 space-y-1 text-sm">
          <p className="font-medium text-foreground">Aktueller Mietvertrag</p>
          <p className="text-muted-foreground">
            {activeLease.unit.property.name} · Einheit {activeLease.unit.unitNumber}
          </p>
          <p className="text-muted-foreground">
            Warmmiete: {(activeLease.coldRent + activeLease.extraCosts).toFixed(2)} €/Monat
          </p>
          <p className="text-muted-foreground">
            Seit: {new Date(activeLease.startDate).toLocaleDateString('de-DE')}
          </p>
        </Card>
      )}

      {/* Daten bearbeiten */}
      <section className="space-y-3">
        <h2 className="font-medium text-foreground">Daten bearbeiten</h2>
        <TenantEditForm tenant={tenant} />
      </section>

      {/* Mieter umziehen */}
      {activeLease && unitsForMove.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-medium text-foreground">Mieter umziehen</h2>
          <p className="text-sm text-muted-foreground">
            Der aktuelle Mietvertrag wird beendet und ein neuer in der gewählten Einheit angelegt.
          </p>
          <MoveUnitDialog
            tenantId={id}
            tenantName={tenant.name}
            options={unitsForMove}
          />
        </section>
      )}
    </div>
  )
}
```

---

## Task 7: TenantCard — Link zur Detailseite

**Files:**
- Modify: `components/tenants/TenantCard.tsx`

- [ ] **Step 1: Import Link hinzufügen und Card verlinken**

```tsx
// Import ergänzen:
import Link from 'next/link'

// Den Card-Wrapper in einen Link-Container einbetten.
// Ersetze die äußerste <Card className="p-5 flex flex-col gap-3"> mit:
<Card className="p-5 flex flex-col gap-3 relative">
  <Link href={`/dashboard/tenants/${tenant.id}`} className="absolute inset-0 rounded-[inherit]" aria-label={`${tenant.name} öffnen`} />
  {/* bestehender Inhalt bleibt unverändert */}
```

Hinweis: Die Buttons (Deaktivieren/Reaktivieren) brauchen `relative z-10` damit sie über dem Link klickbar bleiben.

---

## Task 8: Tenant Profil Selfservice

**Files:**
- Create: `app/tenant/profile/_actions.ts`
- Create: `app/tenant/profile/page.tsx`
- Modify: `components/layout/TenantSidebar.tsx`

- [ ] **Step 1: `_actions.ts` erstellen**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateProfileSchema, type UpdateProfileValues } from '@/lib/schemas/tenant'
import type { ActionResult } from '@/lib/action-result'

export async function updateProfile(data: UpdateProfileValues): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'MIETER') {
    return { success: false, error: 'Nicht autorisiert' }
  }

  const parsed = updateProfileSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Fehler' }

  // E-Mail-Uniqueness prüfen (nur wenn geändert)
  if (parsed.data.email !== session.user.email) {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (existing) return { success: false, error: 'E-Mail bereits vergeben' }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      whatsapp: parsed.data.whatsapp ?? null,
    },
  })
  revalidatePath('/tenant/profile')
  return { success: true, data: undefined }
}
```

- [ ] **Step 2: `page.tsx` erstellen**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateProfileSchema, type UpdateProfileValues } from '@/lib/schemas/tenant'
import { updateProfile } from './_actions'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema) as any,
    defaultValues: {
      name: session?.user?.name ?? '',
      email: session?.user?.email ?? '',
      phone: '',
      whatsapp: '',
    },
  })

  function onSubmit(data: UpdateProfileValues) {
    setServerError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updateProfile(data)
      if (result.success) setSuccess(true)
      else setServerError(result.error)
    })
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Mein Profil</h1>
        <p className="text-sm text-muted-foreground mt-1">Kontaktdaten aktualisieren</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message as string}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">Telefon</Label>
          <Input id="phone" {...register('phone')} placeholder="+49 123 456789" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" {...register('whatsapp')} placeholder="+49 123 456789" />
        </div>
        {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}
        {success && <p className="text-sm text-green-600">Profil gespeichert.</p>}
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? 'Wird gespeichert…' : 'Speichern'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: TenantSidebar — Profil-Eintrag hinzufügen**

```tsx
// Import ergänzen:
import { Home, AlertCircle, FolderOpen, MessageSquare, Bot, Building, CalendarDays, Gauge, UserCircle } from 'lucide-react'

// navItems ergänzen:
{ label: 'Mein Profil', href: '/tenant/profile', icon: UserCircle },
```

---

## Task 9: vectra.ts — role-basierter RAG-Filter

**Files:**
- Modify: `lib/agent/vectra.ts`

- [ ] **Step 1: queryChunks Signatur und Logik erweitern**

```ts
export async function queryChunks(
  vector: number[],
  filter: {
    companyId: string
    tenantId?: string
    propertyIds?: string[]
    role?: 'ADMIN' | 'VERMIETER'
    vermieterId?: string
  },
  topK = 5
) {
  const index = await getIndex()
  const results = await index.queryItems(vector, '', topK * 3)

  return results
    .filter((r) => {
      const m = r.item.metadata as Record<string, string>
      if (m.companyId !== filter.companyId) return false

      // Admin sieht alle Company-Dokumente
      if (filter.role === 'ADMIN') return true

      if (m.scope === 'TENANT') return m.tenantId === filter.tenantId
      if (m.scope === 'PROPERTY') return filter.propertyIds?.includes(m.propertyId ?? '') ?? false
      return true // GLOBAL
    })
    .slice(0, topK)
    .map((r) => ({
      text: (r.item.metadata as Record<string, string>).text,
      documentId: (r.item.metadata as Record<string, string>).documentId,
      score: r.score,
    }))
}
```

---

## Task 10: admin-chat — VERMIETER Scope + RAG Fix

**Files:**
- Modify: `app/api/agent/admin-chat/route.ts`

- [ ] **Step 1: Role ermitteln und Queries filtern**

Am Anfang der POST-Funktion nach Session-Check die Rolle bestimmen und `propertyIds` für VERMIETER laden:

```ts
const role = session.user.role as 'ADMIN' | 'VERMIETER'
const userId = session.user.id

// VERMIETER: zugewiesene Property-IDs laden
let assignedPropertyIds: string[] = []
if (role === 'VERMIETER') {
  const assignments = await prisma.propertyAssignment.findMany({
    where: { userId },
    select: { propertyId: true },
  })
  assignedPropertyIds = assignments.map(a => a.propertyId)
}
```

- [ ] **Step 2: DB-Queries filtern**

Die `Promise.all`-Queries anpassen:

```ts
const propertyWhere =
  role === 'VERMIETER'
    ? { companyId, id: { in: assignedPropertyIds } }
    : { companyId }

const leaseWhere =
  role === 'VERMIETER'
    ? { companyId, status: 'ACTIVE' as const, unit: { property: { id: { in: assignedPropertyIds } } } }
    : { companyId, status: 'ACTIVE' as const }

const ticketWhere =
  role === 'VERMIETER'
    ? { companyId, status: { in: ['OPEN', 'IN_PROGRESS'] as const }, propertyId: { in: assignedPropertyIds } }
    : { companyId, status: { in: ['OPEN', 'IN_PROGRESS'] as const } }

const [properties, leases, tickets, members] = await Promise.all([
  prisma.property.findMany({
    where: propertyWhere,
    include: { units: { include: { leases: { where: { status: 'ACTIVE' }, include: { tenant: { select: { name: true, email: true } } } } } } },
  }),
  prisma.lease.findMany({
    where: leaseWhere,
    include: {
      tenant: { select: { name: true, email: true, phone: true } },
      unit: { include: { property: { select: { name: true, address: true } } } },
    },
    orderBy: { startDate: 'desc' },
  }),
  prisma.ticket.findMany({
    where: ticketWhere,
    include: {
      tenant: { select: { name: true } },
      property: { select: { name: true } },
      unit: { select: { unitNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  }),
  prisma.user.findMany({
    where: { companyId, role: { in: ['ADMIN', 'VERMIETER'] } },
    select: { name: true, role: true, email: true, active: true },
  }),
])
```

- [ ] **Step 3: RAG-Call mit Role-Parameter**

```ts
const queryVector = await getEmbedding(message)
const ragPropertyIds =
  role === 'VERMIETER' ? assignedPropertyIds : undefined

const chunks = await queryChunks(queryVector, {
  companyId,
  role,
  propertyIds: ragPropertyIds,
})
```

- [ ] **Step 4: System-Prompt rollengerecht anpassen**

```ts
const roleHint =
  role === 'VERMIETER'
    ? 'Du sprichst mit einem Vermieter. Zeige nur Daten der ihm zugewiesenen Objekte.'
    : 'Du sprichst mit einem Administrator. Du hast Zugriff auf alle Firmendaten.'

const systemPrompt = `Du bist ein intelligenter Assistent für die Immobilienverwaltung. Antworte auf Deutsch.
${roleHint}

${fullContext}

Beantworte Fragen zu Mietern, Immobilien, Mietverträgen, Schadensmeldungen und Dokumenten direkt aus diesen Daten.`
```
