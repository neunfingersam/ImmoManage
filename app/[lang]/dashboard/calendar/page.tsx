import { getEvents, deleteEvent, getPropertiesAndUnits } from './_actions'
import { EventForm } from '@/components/calendar/EventForm'
import { CalendarClient } from './CalendarClient'

export default async function CalendarPage() {
  const [events, { properties, units }] = await Promise.all([
    getEvents(),
    getPropertiesAndUnits(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Kalender</h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Termin hinzufügen</h2>
        <EventForm properties={properties} units={units} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Wochenansicht</h2>
        <CalendarClient events={events} deleteAction={deleteEvent} />
      </section>
    </div>
  )
}
