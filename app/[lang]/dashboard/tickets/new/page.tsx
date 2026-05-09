import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewTicketForm } from '@/components/tickets/NewTicketForm'
import { getStaffTicketOptions, createStaffTicket } from '../_actions'

export default async function NewDashboardTicketPage() {
  const [lang, options] = await Promise.all([
    getLocale(),
    getStaffTicketOptions(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button render={<Link href={`/${lang}/dashboard/tickets`} />} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück
        </Button>
      </div>

      <div>
        <h1 className="font-serif text-2xl text-foreground">Neue Schadensmeldung erfassen</h1>
        <p className="text-sm text-muted-foreground mt-1">Meldung im Namen der Verwaltung erfassen.</p>
      </div>

      {options.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Keine Liegenschaften mit Einheiten gefunden.</p>
        </div>
      ) : (
        <NewTicketForm
          options={options}
          action={createStaffTicket}
          backPath={`/${lang}/dashboard/tickets`}
        />
      )}
    </div>
  )
}
