// app/tenant/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Home, MapPin } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function TenantPage() {
  const [t, locale, session] = await Promise.all([
    getTranslations('tenant'),
    getLocale(),
    getServerSession(authOptions),
  ])
  if (!session?.user?.id) return null

  const lease = await prisma.lease.findFirst({
    where: { tenantId: session.user.id, status: 'ACTIVE' },
    include: {
      unit: {
        include: { property: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('myApartment')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('welcome', { name: session.user.name?.split(' ')[0] })}
        </p>
      </div>

      {!lease ? (
        <EmptyState
          icon={<Home className="h-7 w-7" />}
          titel={t('noApartmentTitle')}
          beschreibung={t('noApartmentDesc')}
        />
      ) : (
        <div className="space-y-4 max-w-lg">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary shrink-0">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">{lease.unit.property.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {lease.unit.property.address}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">{t('unit')}</p>
                <p className="text-sm font-medium text-foreground">{lease.unit.unitNumber}</p>
              </div>
              {lease.unit.floor != null && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('floor')}</p>
                  <p className="text-sm font-medium text-foreground">{lease.unit.floor}</p>
                </div>
              )}
              {lease.unit.size != null && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('size')}</p>
                  <p className="text-sm font-medium text-foreground">{lease.unit.size} m²</p>
                </div>
              )}
              {lease.unit.rooms != null && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('rooms')}</p>
                  <p className="text-sm font-medium text-foreground">{lease.unit.rooms}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">{t('coldRent')}</p>
                <p className="text-sm font-medium text-foreground">{lease.coldRent.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('extraCosts')}</p>
                <p className="text-sm font-medium text-foreground">{lease.extraCosts.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('warmRent')}</p>
                <p className="text-sm font-medium text-foreground font-serif">
                  {(lease.coldRent + lease.extraCosts).toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('startDate')}</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(lease.startDate).toLocaleDateString(locale)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <Badge variant="secondary">{t('activeLease')}</Badge>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
