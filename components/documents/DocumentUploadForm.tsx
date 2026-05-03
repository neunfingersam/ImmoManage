'use client'

import { useTransition, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { uploadDocument } from '@/app/[lang]/dashboard/documents/_actions'

type Option = { id: string; name: string }

type Props = {
  tenants: Option[]
  properties: Option[]
  defaultPropertyId?: string
}

export function DocumentUploadForm({ tenants, properties, defaultPropertyId }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [category, setCategory] = useState('SONSTIGES')
  const [scope, setScope] = useState(defaultPropertyId ? 'PROPERTY' : 'GLOBAL')
  const [tenantId, setTenantId] = useState('')
  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? '')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData(formRef.current!)
    fd.set('category', category)
    fd.set('scope', scope)
    if (scope === 'TENANT') fd.set('tenantId', tenantId)
    if (scope === 'PROPERTY') fd.set('propertyId', propertyId)
    startTransition(async () => {
      try {
        const result = await uploadDocument(fd)
        if (result.success) {
          setSuccess(true)
          formRef.current?.reset()
          setCategory('SONSTIGES')
          setScope(defaultPropertyId ? 'PROPERTY' : 'GLOBAL')
          setTenantId('')
          setPropertyId(defaultPropertyId ?? '')
        } else {
          setError(result.error ?? 'Unbekannter Fehler')
        }
      } catch (e) {
        setError('Upload fehlgeschlagen. Bitte erneut versuchen.')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-1">
        <Label htmlFor="name">Dokumentname</Label>
        <Input id="name" name="name" placeholder="z.B. Mietvertrag Schmidt" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="file">Datei</Label>
        <Input id="file" name="file" type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" required />
      </div>
      <div className="space-y-1">
        <Label>Kategorie</Label>
        <Select value={category} onValueChange={(v) => setCategory(v ?? 'SONSTIGES')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="MIETVERTRAG">Mietvertrag</SelectItem>
            <SelectItem value="HAUSORDNUNG">Hausordnung</SelectItem>
            <SelectItem value="NEBENKOSTENABRECHNUNG">Nebenkostenabrechnung</SelectItem>
            <SelectItem value="UEBERGABEPROTOKOLL">Übergabeprotokoll</SelectItem>
            <SelectItem value="SONSTIGES">Sonstiges</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Bereich</Label>
        <Select value={scope} onValueChange={(v) => { setScope(v ?? 'GLOBAL'); setTenantId(''); setPropertyId('') }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="GLOBAL">Global (alle Mieter)</SelectItem>
            <SelectItem value="PROPERTY">Immobilie</SelectItem>
            <SelectItem value="TENANT">Mieter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {scope === 'TENANT' && (
        <div className="space-y-1">
          <Label>Mieter</Label>
          <Select value={tenantId} onValueChange={(v) => setTenantId(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Mieter auswählen">
                {tenantId ? (tenants.find(t => t.id === tenantId)?.name ?? tenantId) : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {scope === 'PROPERTY' && (
        <div className="space-y-1">
          <Label>Immobilie</Label>
          <Select value={propertyId} onValueChange={(v) => setPropertyId(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Immobilie auswählen">
                {propertyId ? (properties.find(p => p.id === propertyId)?.name ?? propertyId) : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Dokument hochgeladen und wird indexiert.</p>}
      <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
        {pending ? 'Hochladen…' : 'Hochladen'}
      </Button>
    </form>
  )
}
