'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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

  function FormFields() {
    return (
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
  }

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
