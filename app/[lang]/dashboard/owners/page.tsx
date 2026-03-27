import Link from 'next/link'
import { Plus, Building2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getTranslations } from 'next-intl/server'
import { getOwners } from './_actions'

export default async function OwnersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: locale } = await params
  const t = await getTranslations('owners')
  const owners = await getOwners()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{owners.length} {t('count', { count: owners.length })}</p>
        </div>
        <Button render={<Link href={`/${locale}/dashboard/owners/new`} />} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />
          {t('add')}
        </Button>
      </div>

      {owners.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground text-sm">
          {t('empty')}
        </Card>
      )}

      <div className="space-y-3">
        {owners.map(owner => (
          <Card key={owner.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{owner.name}</p>
                <p className="text-sm text-muted-foreground">{owner.email}</p>
                {owner.propertyOwnerships.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {owner.propertyOwnerships.map(o => (
                      <span key={o.id} className="inline-flex items-center gap-1 text-xs bg-secondary text-foreground px-2 py-1 rounded-full">
                        <Building2 className="h-3 w-3" />
                        {o.property.name}{o.unit ? ` · ${o.unit.unitNumber}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
