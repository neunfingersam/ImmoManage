'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createOwner } from '../_actions'

type Unit = { id: string; unitNumber: string }
type Property = { id: string; name: string; units: Unit[] }

export function NewOwnerForm({ properties }: { properties: Property[] }) {
  const t = useTranslations('owners')
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '')
  const [unitId, setUnitId] = useState('')

  const selectedProperty = properties.find(p => p.id === propertyId)

  function handlePropertyChange(val: string) {
    setPropertyId(val)
    setUnitId('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createOwner({ name, email, propertyId, unitId: unitId || undefined })
      if (result.success) {
        router.push(`/${locale}/dashboard/owners`)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">{t('name')}</Label>
        <Input id="name" required value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label>{t('property')}</Label>
        <Select value={propertyId} onValueChange={val => handlePropertyChange(val ?? '')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {properties.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProperty && selectedProperty.units.length > 0 && (
        <div className="space-y-1">
          <Label>{t('unit')} <span className="text-muted-foreground text-xs">({t('optional')})</span></Label>
          <Select value={unitId} onValueChange={val => setUnitId(val ?? '')}>
            <SelectTrigger><SelectValue placeholder={t('noUnit')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('noUnit')}</SelectItem>
              {selectedProperty.units.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.unitNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
        {t('inviteInfo')}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? t('creating') : t('create')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  )
}
