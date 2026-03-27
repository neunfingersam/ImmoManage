import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/card'
import { Building2, AlertCircle, MessageSquare, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function OwnerPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: locale } = await params
  const session = await getServerSession(authOptions)
  const t = await getTranslations('owner')

  const ownerships = await prisma.propertyOwner.findMany({
    where: { userId: session!.user.id },
    include: {
      property: { select: { id: true, name: true, address: true, type: true } },
      unit: { select: { id: true, unitNumber: true, floor: true } },
    },
  })

  const [openTickets, unreadMessages, documentCount] = await Promise.all([
    prisma.ticket.count({
      where: {
        tenantId: session!.user.id,
        status: { not: 'DONE' },
      },
    }),
    prisma.message.count({
      where: { toId: session!.user.id, read: false },
    }),
    prisma.document.count({
      where: { tenantId: session!.user.id },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link href={`/${locale}/owner/tickets`}>
          <Card className="p-4 hover:border-primary/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('openTickets')}</p>
                <p className="text-xl font-semibold text-foreground">{openTickets}</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href={`/${locale}/owner/messages`}>
          <Card className="p-4 hover:border-primary/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('unreadMessages')}</p>
                <p className="text-xl font-semibold text-foreground">{unreadMessages}</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href={`/${locale}/owner/documents`}>
          <Card className="p-4 hover:border-primary/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('documents')}</p>
                <p className="text-xl font-semibold text-foreground">{documentCount}</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Properties */}
      <div className="space-y-3">
        <h2 className="font-medium text-foreground">{t('myProperties')}</h2>
        {ownerships.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            {t('noProperties')}
          </Card>
        )}
        {ownerships.map(o => (
          <Card key={o.id} className="p-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">{o.property.name}</p>
                <p className="text-sm text-muted-foreground">{o.property.address}</p>
                {o.unit && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('unit')}: {o.unit.unitNumber}
                    {o.unit.floor != null ? ` · ${t('floor')} ${o.unit.floor}` : ''}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
