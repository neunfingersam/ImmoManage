# WEG Modul 2: Erneuerungsfonds — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Erneuerungsfonds-Seite unter `/dashboard/weg/[propertyId]/fonds` mit Prognose-Chart, Erneuerungsplan-CRUD, Einstellungen und PDF-Export.

**Architecture:** Server Component page fetches WegConfig + RenewalPlanItems, renders client components for Chart (Recharts), CRUD-Tabelle (Dialog-Modal), Einstellungen-Form und PDF-Button. Neue Server Actions in bestehende `_actions.ts` eingefügt.

**Tech Stack:** Next.js 16.2, React 19, Prisma + Turso, Recharts, @react-pdf/renderer, @base-ui Dialog, Tailwind CSS

---

## File Map

| File | Status | Verantwortlichkeit |
|------|--------|--------------------|
| `app/[lang]/dashboard/weg/_actions.ts` | Modify | +addRenewalItem, +updateRenewalItem, +deleteRenewalItem, +updateFondsStand |
| `app/[lang]/dashboard/weg/[propertyId]/fonds/page.tsx` | Create | Server Component, lädt Daten, rendert Layout |
| `app/[lang]/dashboard/weg/[propertyId]/fonds/FondsChart.tsx` | Create | 'use client', Recharts LineChart 20-Jahre-Prognose |
| `app/[lang]/dashboard/weg/[propertyId]/fonds/RenewalPlanSection.tsx` | Create | 'use client', Tabelle + Add/Edit/Delete Modal |
| `app/[lang]/dashboard/weg/[propertyId]/fonds/FondsSettingsForm.tsx` | Create | 'use client', Beitragssatz / Obergrenze / Fondsstand |
| `app/[lang]/dashboard/weg/[propertyId]/fonds/FondsPdfButton.tsx` | Create | 'use client', PDF-Download via @react-pdf/renderer |

---

## Task 1: Server Actions

**Files:**
- Modify: `app/[lang]/dashboard/weg/_actions.ts`

- [ ] **Step 1: Append die neuen Actions ans Ende der Datei**

```typescript
// ─── Renewal Plan Items ────────────────────────────────────────────────────────
const renewalItemSchema = z.object({
  bauteil: z.string().min(1, 'Bauteil erforderlich'),
  restlebensdauer: z.number().int().min(1).max(100).optional(),
  erneuerungskosten: z.number().positive().optional(),
  letzteErneuerung: z.number().int().min(1900).max(2100).optional(),
})

export async function addRenewalItem(propertyId: string, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = renewalItemSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const config = await prisma.wegConfig.findUnique({ where: { propertyId } })
  if (!config) return { success: false, error: 'WEG-Konfiguration nicht gefunden' }

  await prisma.renewalPlanItem.create({
    data: { wegConfigId: config.id, ...parsed.data },
  })

  revalidatePath(`/dashboard/weg/${propertyId}/fonds`)
  return { success: true, data: null }
}

export async function updateRenewalItem(id: string, propertyId: string, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = renewalItemSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  await prisma.renewalPlanItem.update({ where: { id }, data: parsed.data })

  revalidatePath(`/dashboard/weg/${propertyId}/fonds`)
  return { success: true, data: null }
}

export async function deleteRenewalItem(id: string, propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  await prisma.renewalPlanItem.delete({ where: { id } })

  revalidatePath(`/dashboard/weg/${propertyId}/fonds`)
  return { success: true, data: null }
}

// ─── Fonds Stand aktualisieren ────────────────────────────────────────────────
const fondsStandSchema = z.object({
  fondsStand: z.number().min(0, 'Fondsstand muss >= 0 sein'),
  fondsBeitragssatz: z.number().min(0).max(10),
  fondsObergrenze: z.number().min(0).max(50),
})

export async function updateFondsConfig(propertyId: string, data: unknown) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) return { success: false, error: 'Nicht autorisiert' }

  const parsed = fondsStandSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  await prisma.wegConfig.upsert({
    where: { propertyId },
    update: { ...parsed.data, fondsLetzteEinzahlung: new Date() },
    create: { propertyId, ...parsed.data },
  })

  revalidatePath(`/dashboard/weg/${propertyId}/fonds`)
  return { success: true, data: null }
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/[lang]/dashboard/weg/_actions.ts"
git commit -m "feat: WEG Modul 2 — server actions für Erneuerungsfonds"
```

---

## Task 2: FondsChart Component

**Files:**
- Create: `app/[lang]/dashboard/weg/[propertyId]/fonds/FondsChart.tsx`

- [ ] **Step 1: Datei erstellen**

```typescript
'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts'

type RenewalItem = {
  restlebensdauer: number | null
  erneuerungskosten: number | null
  letzteErneuerung: number | null
}

type FondsChartProps = {
  fondsStand: number
  fondsBeitragssatz: number      // % vom Gebäudeversicherungswert pro Jahr
  gebVersicherungswert: number   // CHF
  renewalItems: RenewalItem[]
}

function fmt(n: number) {
  return new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(n)
}

export function FondsChart({ fondsStand, fondsBeitragssatz, gebVersicherungswert, renewalItems }: FondsChartProps) {
  const currentYear = new Date().getFullYear()
  const annualContribution = gebVersicherungswert * (fondsBeitragssatz / 100)

  const data: { year: number; fondsStand: number; erneuerung: number }[] = []
  let balance = fondsStand

  for (let i = 0; i <= 20; i++) {
    const year = currentYear + i
    const renewalCost = renewalItems
      .filter(r => {
        const base = r.letzteErneuerung ?? currentYear
        const due = base + (r.restlebensdauer ?? 0)
        return due === year
      })
      .reduce((s, r) => s + (r.erneuerungskosten ?? 0), 0)

    if (i > 0) balance = balance + annualContribution - renewalCost
    data.push({ year, fondsStand: Math.max(0, Math.round(balance)), erneuerung: Math.round(renewalCost) })
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => `${fmt(v / 1000)}k`} tick={{ fontSize: 12 }} width={70} />
        <Tooltip
          formatter={(value: number, name: string) => [
            `CHF ${fmt(value)}`,
            name === 'fondsStand' ? 'Fondsstand' : 'Erneuerungskosten',
          ]}
          labelFormatter={(l) => `Jahr ${l}`}
        />
        <Legend
          formatter={(v) => v === 'fondsStand' ? 'Fondsstand' : 'Erneuerungskosten'}
        />
        <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
        <Line type="monotone" dataKey="fondsStand" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="erneuerung" stroke="hsl(var(--destructive))" strokeWidth={1} strokeDasharray="4 4" dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/[lang]/dashboard/weg/[propertyId]/fonds/FondsChart.tsx"
git commit -m "feat: WEG Modul 2 — FondsChart (Recharts 20-Jahre-Prognose)"
```

---

## Task 3: RenewalPlanSection Component

**Files:**
- Create: `app/[lang]/dashboard/weg/[propertyId]/fonds/RenewalPlanSection.tsx`

- [ ] **Step 1: Datei erstellen**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { addRenewalItem, updateRenewalItem, deleteRenewalItem } from '@/app/[lang]/dashboard/weg/_actions'

type RenewalItem = {
  id: string
  bauteil: string
  restlebensdauer: number | null
  erneuerungskosten: number | null
  letzteErneuerung: number | null
}

type Props = { propertyId: string; items: RenewalItem[] }

const emptyForm = { bauteil: '', restlebensdauer: '', erneuerungskosten: '', letzteErneuerung: '' }

function fmt(n: number) {
  return new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(n)
}

export function RenewalPlanSection({ propertyId, items }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<RenewalItem | null>(null)
  const [form, setForm] = useState(emptyForm)

  function openAdd() {
    setForm(emptyForm)
    setError(null)
    setAddOpen(true)
  }

  function openEdit(item: RenewalItem) {
    setForm({
      bauteil: item.bauteil,
      restlebensdauer: item.restlebensdauer?.toString() ?? '',
      erneuerungskosten: item.erneuerungskosten?.toString() ?? '',
      letzteErneuerung: item.letzteErneuerung?.toString() ?? '',
    })
    setError(null)
    setEditItem(item)
  }

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  function parseForm() {
    return {
      bauteil: form.bauteil,
      restlebensdauer: form.restlebensdauer ? parseInt(form.restlebensdauer) : undefined,
      erneuerungskosten: form.erneuerungskosten ? parseFloat(form.erneuerungskosten) : undefined,
      letzteErneuerung: form.letzteErneuerung ? parseInt(form.letzteErneuerung) : undefined,
    }
  }

  function handleAdd() {
    startTransition(async () => {
      const res = await addRenewalItem(propertyId, parseForm())
      if (!res.success) { setError(res.error ?? 'Fehler'); return }
      setAddOpen(false)
    })
  }

  function handleEdit() {
    if (!editItem) return
    startTransition(async () => {
      const res = await updateRenewalItem(editItem.id, propertyId, parseForm())
      if (!res.success) { setError(res.error ?? 'Fehler'); return }
      setEditItem(null)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Eintrag wirklich löschen?')) return
    startTransition(async () => {
      await deleteRenewalItem(id, propertyId)
    })
  }

  const currentYear = new Date().getFullYear()

  const FormFields = () => (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div>
        <Label>Bauteil *</Label>
        <Input value={form.bauteil} onChange={e => set('bauteil', e.target.value)} placeholder="z.B. Flachdach, Lift, Heizung" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Letzte Erneuerung (Jahr)</Label>
          <Input type="number" value={form.letzteErneuerung} onChange={e => set('letzteErneuerung', e.target.value)} placeholder={`z.B. ${currentYear - 5}`} />
        </div>
        <div>
          <Label>Restlebensdauer (Jahre)</Label>
          <Input type="number" value={form.restlebensdauer} onChange={e => set('restlebensdauer', e.target.value)} placeholder="z.B. 15" />
        </div>
      </div>
      <div>
        <Label>Erneuerungskosten (CHF)</Label>
        <Input type="number" value={form.erneuerungskosten} onChange={e => set('erneuerungskosten', e.target.value)} placeholder="z.B. 80000" />
      </div>
    </div>
  )

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Erneuerungsplan</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" />Bauteil hinzufügen</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Bauteil hinzufügen</DialogTitle></DialogHeader>
            <FormFields />
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Abbrechen</Button>} />
              <Button onClick={handleAdd} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Hinzufügen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Noch keine Bauteile erfasst.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left pb-2 pr-4">Bauteil</th>
                <th className="text-right pb-2 pr-4">Letzte Ern.</th>
                <th className="text-right pb-2 pr-4">Restleben</th>
                <th className="text-right pb-2 pr-4">Fällig</th>
                <th className="text-right pb-2 pr-4">Kosten (CHF)</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const base = item.letzteErneuerung ?? currentYear
                const due = item.restlebensdauer != null ? base + item.restlebensdauer : null
                const urgent = due != null && due <= currentYear + 5
                return (
                  <tr key={item.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4 font-medium">{item.bauteil}</td>
                    <td className="py-2 pr-4 text-right text-muted-foreground">{item.letzteErneuerung ?? '—'}</td>
                    <td className="py-2 pr-4 text-right text-muted-foreground">{item.restlebensdauer != null ? `${item.restlebensdauer} J.` : '—'}</td>
                    <td className={`py-2 pr-4 text-right font-medium ${urgent ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {due ?? '—'}
                    </td>
                    <td className="py-2 pr-4 text-right">{item.erneuerungskosten != null ? `CHF ${fmt(item.erneuerungskosten)}` : '—'}</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Dialog open={editItem?.id === item.id} onOpenChange={open => { if (!open) setEditItem(null) }}>
                          <DialogTrigger render={<Button size="sm" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>} />
                          <DialogContent>
                            <DialogHeader><DialogTitle>Bauteil bearbeiten</DialogTitle></DialogHeader>
                            <FormFields />
                            <DialogFooter>
                              <DialogClose render={<Button variant="outline" onClick={() => setEditItem(null)}>Abbrechen</Button>} />
                              <Button onClick={handleEdit} disabled={isPending}>
                                {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                                Speichern
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} disabled={isPending}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/[lang]/dashboard/weg/[propertyId]/fonds/RenewalPlanSection.tsx"
git commit -m "feat: WEG Modul 2 — RenewalPlanSection CRUD"
```

---

## Task 4: FondsSettingsForm Component

**Files:**
- Create: `app/[lang]/dashboard/weg/[propertyId]/fonds/FondsSettingsForm.tsx`

- [ ] **Step 1: Datei erstellen**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateFondsConfig } from '@/app/[lang]/dashboard/weg/_actions'

type Props = {
  propertyId: string
  initial: {
    fondsStand: number | null
    fondsBeitragssatz: number
    fondsObergrenze: number
    fondsLetzteEinzahlung: Date | null
  }
}

export function FondsSettingsForm({ propertyId, initial }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [form, setFormState] = useState({
    fondsStand: initial.fondsStand?.toString() ?? '',
    fondsBeitragssatz: initial.fondsBeitragssatz.toString(),
    fondsObergrenze: initial.fondsObergrenze.toString(),
  })

  function set(field: keyof typeof form, value: string) {
    setFormState(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateFondsConfig(propertyId, {
        fondsStand: form.fondsStand ? parseFloat(form.fondsStand) : 0,
        fondsBeitragssatz: parseFloat(form.fondsBeitragssatz),
        fondsObergrenze: parseFloat(form.fondsObergrenze),
      })
      if (!res.success) { setError(res.error ?? 'Fehler'); return }
      setSaved(true)
    })
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-foreground mb-4">Fonds-Einstellungen</h2>
      <div className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div>
          <Label>Aktueller Fondsstand (CHF)</Label>
          <Input type="number" value={form.fondsStand} onChange={e => set('fondsStand', e.target.value)} placeholder="0.00" />
          {initial.fondsLetzteEinzahlung && (
            <p className="text-xs text-muted-foreground mt-1">
              Letzte Aktualisierung: {new Date(initial.fondsLetzteEinzahlung).toLocaleDateString('de-CH')}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Beitragssatz (% vom Gebäudeversicherungswert/Jahr)</Label>
            <Input type="number" step="0.1" value={form.fondsBeitragssatz} onChange={e => set('fondsBeitragssatz', e.target.value)} />
          </div>
          <div>
            <Label>Obergrenze (Monatslöhne)</Label>
            <Input type="number" step="0.5" value={form.fondsObergrenze} onChange={e => set('fondsObergrenze', e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Speichern
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Gespeichert
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/[lang]/dashboard/weg/[propertyId]/fonds/FondsSettingsForm.tsx"
git commit -m "feat: WEG Modul 2 — FondsSettingsForm"
```

---

## Task 5: FondsPdfButton Component

**Files:**
- Create: `app/[lang]/dashboard/weg/[propertyId]/fonds/FondsPdfButton.tsx`

- [ ] **Step 1: Datei erstellen**

```typescript
'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

type RenewalItem = {
  bauteil: string
  restlebensdauer: number | null
  erneuerungskosten: number | null
  letzteErneuerung: number | null
}

type Props = {
  propertyName: string
  kanton: string | null
  fondsStand: number | null
  fondsBeitragssatz: number
  ampelStatus: 'gruen' | 'gelb' | 'rot'
  renewalItems: RenewalItem[]
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#666', marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, borderBottom: '1 solid #e5e7eb', paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  label: { color: '#666' },
  value: { fontFamily: 'Helvetica-Bold' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: '4 6', marginBottom: 2 },
  tableRow: { flexDirection: 'row', padding: '4 6', borderBottom: '1 solid #f3f4f6' },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'right' },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },
  ampelGruen: { color: '#16a34a', fontFamily: 'Helvetica-Bold' },
  ampelGelb: { color: '#d97706', fontFamily: 'Helvetica-Bold' },
  ampelRot: { color: '#dc2626', fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#999', fontSize: 8 },
})

function fmt(n: number) {
  return new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function ampelLabel(s: 'gruen' | 'gelb' | 'rot') {
  return s === 'gruen' ? '● Gut gedeckt' : s === 'gelb' ? '● Teilweise gedeckt' : '● Unterdeckt'
}

function PdfDocument({ propertyName, kanton, fondsStand, fondsBeitragssatz, ampelStatus, renewalItems }: Props) {
  const currentYear = new Date().getFullYear()
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Erneuerungsfonds-Bericht</Text>
        <Text style={styles.subtitle}>{propertyName}{kanton ? ` · ${kanton}` : ''} · {new Date().toLocaleDateString('de-CH')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Übersicht</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Aktueller Fondsstand</Text>
            <Text style={styles.value}>CHF {fondsStand != null ? fmt(fondsStand) : '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Beitragssatz</Text>
            <Text style={styles.value}>{fondsBeitragssatz} % / Jahr</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Deckungsgrad (nächste 5 Jahre)</Text>
            <Text style={ampelStatus === 'gruen' ? styles.ampelGruen : ampelStatus === 'gelb' ? styles.ampelGelb : styles.ampelRot}>
              {ampelLabel(ampelStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Erneuerungsplan</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Bauteil</Text>
            <Text style={styles.col2}>Letzte Ern.</Text>
            <Text style={styles.col3}>Fällig</Text>
            <Text style={styles.col4}>Kosten (CHF)</Text>
          </View>
          {renewalItems.length === 0 ? (
            <Text style={{ color: '#999', padding: 6 }}>Keine Einträge</Text>
          ) : renewalItems.map((item, i) => {
            const base = item.letzteErneuerung ?? currentYear
            const due = item.restlebensdauer != null ? base + item.restlebensdauer : null
            return (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{item.bauteil}</Text>
                <Text style={styles.col2}>{item.letzteErneuerung ?? '—'}</Text>
                <Text style={styles.col3}>{due ?? '—'}</Text>
                <Text style={styles.col4}>{item.erneuerungskosten != null ? fmt(item.erneuerungskosten) : '—'}</Text>
              </View>
            )
          })}
        </View>

        <Text style={styles.footer}>Erstellt mit ImmoManage · {new Date().toLocaleDateString('de-CH')}</Text>
      </Page>
    </Document>
  )
}

export function FondsPdfButton(props: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const blob = await pdf(<PdfDocument {...props} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Erneuerungsfonds-${props.propertyName.replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleDownload} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileDown className="h-4 w-4 mr-1.5" />}
      PDF exportieren
    </Button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/[lang]/dashboard/weg/[propertyId]/fonds/FondsPdfButton.tsx"
git commit -m "feat: WEG Modul 2 — FondsPdfButton (PDF-Export)"
```

---

## Task 6: Fonds Page (Server Component)

**Files:**
- Create: `app/[lang]/dashboard/weg/[propertyId]/fonds/page.tsx`

- [ ] **Step 1: Datei erstellen**

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getWegProperty } from '@/app/[lang]/dashboard/weg/_actions'
import { FondsChart } from './FondsChart'
import { RenewalPlanSection } from './RenewalPlanSection'
import { FondsSettingsForm } from './FondsSettingsForm'
import { FondsPdfButton } from './FondsPdfButton'

type AmpelStatus = 'gruen' | 'gelb' | 'rot'

function calcAmpel(
  fondsStand: number | null,
  renewalItems: { restlebensdauer: number | null; erneuerungskosten: number | null; letzteErneuerung: number | null }[],
): AmpelStatus {
  if (fondsStand == null) return 'rot'
  const currentYear = new Date().getFullYear()
  const costs5 = renewalItems
    .filter(r => {
      const base = r.letzteErneuerung ?? currentYear
      const due = r.restlebensdauer != null ? base + r.restlebensdauer : null
      return due != null && due <= currentYear + 5
    })
    .reduce((s, r) => s + (r.erneuerungskosten ?? 0), 0)
  if (costs5 === 0) return 'gruen'
  const coverage = fondsStand / costs5
  if (coverage >= 1.0) return 'gruen'
  if (coverage >= 0.5) return 'gelb'
  return 'rot'
}

function AmpelBadge({ status }: { status: AmpelStatus }) {
  if (status === 'gruen') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
      <CheckCircle2 className="h-4 w-4" /> Gut gedeckt
    </span>
  )
  if (status === 'gelb') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700">
      <AlertTriangle className="h-4 w-4" /> Teilweise gedeckt
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700">
      <XCircle className="h-4 w-4" /> Unterdeckt
    </span>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

export default async function FondsPage({
  params,
}: {
  params: Promise<{ propertyId: string }>
}) {
  const { propertyId } = await params
  const property = await getWegProperty(propertyId)
  if (!property) notFound()

  const cfg = property.wegConfig
  const renewalItems = cfg?.renewalItems ?? []
  const ampelStatus = calcAmpel(cfg?.fondsStand ?? null, renewalItems)

  const showChart = cfg?.gebVersicherungswert != null && cfg?.fondsBeitragssatz != null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link href={`/dashboard/weg/${propertyId}`} />}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-serif text-2xl text-foreground">Erneuerungsfonds</h1>
            <p className="text-sm text-muted-foreground">{property.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AmpelBadge status={ampelStatus} />
          <FondsPdfButton
            propertyName={property.name}
            kanton={cfg?.kanton ?? null}
            fondsStand={cfg?.fondsStand ?? null}
            fondsBeitragssatz={cfg?.fondsBeitragssatz ?? 0.4}
            ampelStatus={ampelStatus}
            renewalItems={renewalItems}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Aktueller Fondsstand</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {cfg?.fondsStand != null ? `CHF ${fmt(cfg.fondsStand)}` : '—'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Jahresbeitrag (geschätzt)</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {cfg?.gebVersicherungswert && cfg?.fondsBeitragssatz
              ? `CHF ${fmt(cfg.gebVersicherungswert * (cfg.fondsBeitragssatz / 100))}`
              : '—'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Geplante Erneuerungen (5 J.)</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {(() => {
              const currentYear = new Date().getFullYear()
              const total = renewalItems
                .filter(r => {
                  const base = r.letzteErneuerung ?? currentYear
                  const due = r.restlebensdauer != null ? base + r.restlebensdauer : null
                  return due != null && due <= currentYear + 5
                })
                .reduce((s, r) => s + (r.erneuerungskosten ?? 0), 0)
              return total > 0 ? `CHF ${fmt(total)}` : '—'
            })()}
          </p>
        </Card>
      </div>

      {/* Chart */}
      {showChart ? (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">20-Jahre-Prognose</h2>
          </div>
          <FondsChart
            fondsStand={cfg!.fondsStand ?? 0}
            fondsBeitragssatz={cfg!.fondsBeitragssatz}
            gebVersicherungswert={cfg!.gebVersicherungswert!}
            renewalItems={renewalItems}
          />
        </Card>
      ) : (
        <Card className="p-5 text-center text-sm text-muted-foreground">
          Für die Prognose bitte Gebäudeversicherungswert und Beitragssatz in den Einstellungen erfassen.
        </Card>
      )}

      {/* Renewal Plan Table */}
      <RenewalPlanSection propertyId={propertyId} items={renewalItems} />

      {/* Fonds Settings */}
      <FondsSettingsForm
        propertyId={propertyId}
        initial={{
          fondsStand: cfg?.fondsStand ?? null,
          fondsBeitragssatz: cfg?.fondsBeitragssatz ?? 0.4,
          fondsObergrenze: cfg?.fondsObergrenze ?? 5.0,
          fondsLetzteEinzahlung: cfg?.fondsLetzteEinzahlung ?? null,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Prüfen ob `getWegProperty` `renewalItems` mitlädt**

Öffne `app/[lang]/dashboard/weg/_actions.ts`, Funktion `getWegProperty`. Das `include` für `wegConfig` muss `renewalItems: true` enthalten:

```typescript
wegConfig: { include: { renewalItems: true, expenses: true } },
```

Das ist bereits so definiert (commit 0e91291). Keine Änderung nötig.

- [ ] **Step 3: Commit**

```bash
git add "app/[lang]/dashboard/weg/[propertyId]/fonds/page.tsx"
git commit -m "feat: WEG Modul 2 — Erneuerungsfonds-Seite vollständig"
```

---

## Task 7: Navigation verlinken

**Files:**
- Modify: `app/[lang]/dashboard/weg/[propertyId]/page.tsx`

- [ ] **Step 1: Link zur Fonds-Seite im Detail-Header ergänzen**

Öffne `app/[lang]/dashboard/weg/[propertyId]/page.tsx`. Suche den Bereich wo die Navigationskarten/-links für Settings und Owners stehen. Füge einen Link zur Fonds-Seite hinzu.

Finde die Stelle wo `/dashboard/weg/${propertyId}/settings` oder `/dashboard/weg/${propertyId}/owners` verlinkt wird und ergänze:

```tsx
<Link href={`/dashboard/weg/${propertyId}/fonds`}>
  <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10">
        <TrendingUp className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="font-medium text-sm">Erneuerungsfonds</p>
        <p className="text-xs text-muted-foreground">
          {cfg?.fondsStand != null ? `CHF ${fmt(cfg.fondsStand)}` : 'Noch nicht erfasst'}
        </p>
      </div>
    </div>
  </Card>
</Link>
```

Import `TrendingUp` von `lucide-react` hinzufügen falls nicht vorhanden.

- [ ] **Step 2: Commit + Push**

```bash
git add "app/[lang]/dashboard/weg/[propertyId]/page.tsx"
git commit -m "feat: WEG Modul 2 — Link zur Erneuerungsfonds-Seite in Detailseite"
git push
```

---

## Self-Review

- ✅ Alle 7 TODO-Features abgedeckt (Chart, Ampel, Tabelle, CRUD, Einstellungen, Fondsstand, PDF)
- ✅ Alle neuen Actions in `_actions.ts` mit Zod-Validierung und Session-Check
- ✅ Typen konsistent: `RenewalItem` überall gleich definiert
- ✅ `getWegProperty` lädt bereits `renewalItems` (laut vorhandenem Code)
- ✅ PDF client-seitig (kein neuer API-Route nötig)
- ✅ Ampel-Logik identisch in page.tsx und PdfButton-Props
