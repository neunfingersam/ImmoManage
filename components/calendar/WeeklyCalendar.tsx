'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const typeColors: Record<string, string> = {
  VERTRAGSENDE: 'bg-red-100 text-red-800 border-red-200',
  ABLESUNG: 'bg-blue-100 text-blue-800 border-blue-200',
  KUENDIGUNG: 'bg-red-100 text-red-800 border-red-200',
  WARTUNG: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SONSTIGES: 'bg-secondary text-foreground border-border',
}

const typeLabels: Record<string, string> = {
  VERTRAGSENDE: 'Vertragsende', ABLESUNG: 'Ablesung', KUENDIGUNG: 'Kündigung',
  WARTUNG: 'Wartung', SONSTIGES: 'Sonstiges',
}

const DAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

type Event = {
  id: string
  title: string
  date: Date | string
  type: string
  property?: { name: string } | null
  unit?: { unitNumber: string } | null
  user: { name: string }
}

type Props = {
  events: Event[]
  onDelete: (id: string) => Promise<void>
}

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function WeeklyCalendar({ events, onDelete }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function prevWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }

  function nextWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  function goToday() {
    setWeekStart(getMonday(new Date()))
  }

  const weekEnd = weekDays[6]
  const headerLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${MONTHS_DE[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    : `${MONTHS_DE[weekStart.getMonth()]} – ${MONTHS_DE[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`

  function getEventsForDay(day: Date) {
    return events.filter(e => isSameDay(new Date(e.date), day))
  }

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday} className="ml-1">
            Heute
          </Button>
        </div>
        <h2 className="font-serif text-lg text-foreground">{headerLabel}</h2>
        <div className="w-28" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-card overflow-hidden border border-border">
        {/* Header row */}
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={i} className={`bg-background px-2 py-2 text-center ${isToday ? 'bg-secondary' : ''}`}>
              <p className="text-xs text-muted-foreground">{DAYS_DE[i]}</p>
              <p className={`text-lg font-serif leading-tight ${isToday ? 'text-primary font-medium' : 'text-foreground'}`}>
                {day.getDate()}
              </p>
            </div>
          )
        })}

        {/* Event rows */}
        {weekDays.map((day, i) => {
          const dayEvents = getEventsForDay(day)
          const isToday = isSameDay(day, today)
          return (
            <div
              key={`events-${i}`}
              className={`bg-background min-h-28 p-1.5 space-y-1 ${isToday ? 'bg-secondary/20' : ''}`}
            >
              {dayEvents.length === 0 && (
                <div className="h-full" />
              )}
              {dayEvents.map(e => (
                <div
                  key={e.id}
                  className={`rounded-md border px-2 py-1 text-xs ${typeColors[e.type] ?? typeColors.SONSTIGES} group relative`}
                >
                  <p className="font-medium truncate pr-4">{e.title}</p>
                  {e.property && (
                    <p className="truncate opacity-75">
                      {e.property.name}{e.unit ? ` · ${e.unit.unitNumber}` : ''}
                    </p>
                  )}
                  <button
                    onClick={() => onDelete(e.id)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-current hover:opacity-60"
                    aria-label="Löschen"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-2 pt-1">
        {Object.entries(typeLabels).map(([key, label]) => (
          <span key={key} className={`text-xs px-2 py-0.5 rounded-full border ${typeColors[key]}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
