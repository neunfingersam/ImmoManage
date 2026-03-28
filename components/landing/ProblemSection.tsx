import { useTranslations } from 'next-intl'
import { TableProperties, Receipt, PhoneCall } from 'lucide-react'

const items = [
  {
    key: 'item1',
    icon: TableProperties,
    number: '01',
    accent: '#ef4444',
    timeWasted: '~4h / Woche',
  },
  {
    key: 'item2',
    icon: Receipt,
    number: '02',
    accent: '#f59e0b',
    timeWasted: '~2h / Monat',
  },
  {
    key: 'item3',
    icon: PhoneCall,
    number: '03',
    accent: '#f59e0b',
    timeWasted: 'Unnötig',
  },
] as const

export default function ProblemSection() {
  const t = useTranslations('landing.problem')

  return (
    <section className="bg-[#FAFAF8] py-24">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest" style={{ color: '#E8734A' }}>
            Der alte Weg
          </p>
          <h2 className="font-heading text-4xl font-bold text-[#1A1A2E] md:text-5xl">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#1A1A2E]/50">
            Was Hausverwalter täglich Zeit, Nerven und Geld kostet — und längst gelöst sein sollte.
          </p>
        </div>

        {/* Pain cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {items.map(({ key, icon: Icon, number, accent, timeWasted }) => (
            <div
              key={key}
              className="group relative overflow-hidden rounded-2xl bg-white p-8 transition-shadow hover:shadow-lg"
              style={{ border: '1px solid rgba(0,0,0,0.07)' }}
            >
              {/* Big faded number — background decoration */}
              <span
                className="pointer-events-none absolute -right-3 -top-4 select-none font-bold leading-none"
                style={{ fontSize: '8rem', color: 'rgba(0,0,0,0.04)' }}
                aria-hidden
              >
                {number}
              </span>

              {/* Top: icon + time wasted */}
              <div className="mb-6 flex items-start justify-between">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${accent}12` }}
                >
                  <Icon className="h-5 w-5" style={{ color: accent }} />
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: `${accent}12`,
                    color: accent,
                  }}
                >
                  {timeWasted}
                </span>
              </div>

              {/* Left accent bar on hover */}
              <div
                className="absolute left-0 top-0 h-full w-1 scale-y-0 rounded-l-2xl transition-transform duration-300 group-hover:scale-y-100"
                style={{ backgroundColor: accent, transformOrigin: 'top' }}
              />

              <h3 className="mb-3 text-lg font-bold text-[#1A1A2E]">
                {t(`${key}Title` as `item1Title` | `item2Title` | `item3Title`)}
              </h3>
              <p className="leading-relaxed text-[#1A1A2E]/55 text-sm">
                {t(`${key}Desc` as `item1Desc` | `item2Desc` | `item3Desc`)}
              </p>
            </div>
          ))}
        </div>

        {/* Resolution line */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#1A1A2E]/40">
            Das war gestern.{' '}
            <span className="font-semibold" style={{ color: '#E8734A' }}>
              ImmoManage erledigt das automatisch.
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
