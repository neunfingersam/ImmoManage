import { getTranslations } from 'next-intl/server'
import { getOwnerProperties, createOwnerTicket } from '../_actions'
import { NewTicketForm } from '@/app/[lang]/tenant/tickets/new/NewTicketForm'

export default async function OwnerNewTicketPage() {
  const t = await getTranslations('owner')
  const ownerships = await getOwnerProperties()

  const options = ownerships.map(o => ({
    propertyId: o.property.id,
    propertyName: o.property.name,
    unitId: o.unit?.id ?? o.propertyId,
    unitNumber: o.unit?.unitNumber ?? '—',
  }))

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{t('newTicket')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('newTicketDesc')}</p>
      </div>
      <NewTicketForm options={options} action={createOwnerTicket} backPath="/owner/tickets" />
    </div>
  )
}
