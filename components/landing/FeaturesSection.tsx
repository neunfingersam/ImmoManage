import { useTranslations } from 'next-intl'
import { Building2, Users, FileCheck2, MessageSquare, Sparkles, FileText, ClipboardCheck, Calculator } from 'lucide-react'

const features = [
  { key: 'f1', Icon: Building2,       color: '#3b82f6', badge: null },
  { key: 'f2', Icon: Users,           color: '#16a34a', badge: null },
  { key: 'f3', Icon: FileCheck2,      color: '#E8734A', badge: 'CAMT.053' },
  { key: 'f4', Icon: MessageSquare,   color: '#8b5cf6', badge: null },
  { key: 'f5', Icon: Sparkles,        color: '#E8734A', badge: 'Neu' },
  { key: 'f6', Icon: FileText,        color: '#0d9488', badge: null },
  { key: 'f7', Icon: ClipboardCheck,  color: '#0d9488', badge: null },
  { key: 'f8', Icon: Calculator,      color: '#8b5cf6', badge: null },
] as const

export default function FeaturesSection() {
  const t = useTranslations('landing.features')

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest" style={{ color: '#E8734A' }}>
            Alles drin. Nichts vergessen.
          </p>
          <h2 className="font-heading text-4xl font-bold text-[#1A1A2E] md:text-5xl">
            {t('title')}
          </h2>
        </div>

        {/* Feature grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map(({ key, Icon, color, badge }) => (
            <div
              key={key}
              className="group relative rounded-2xl bg-[#FAFAF8] p-7 transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ border: '1px solid rgba(0,0,0,0.06)' }}
            >
              {/* Badge */}
              {badge && (
                <span
                  className="absolute right-5 top-5 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {badge}
                </span>
              )}

              {/* Icon */}
              <div
                className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>

              <h3 className="mb-2 font-semibold text-[#1A1A2E]">
                {t(`${key}Title` as `f1Title` | `f2Title` | `f3Title` | `f4Title` | `f5Title` | `f6Title` | `f7Title` | `f8Title`)}
              </h3>
              <p className="text-sm leading-relaxed text-[#1A1A2E]/55">
                {t(`${key}Desc` as `f1Desc` | `f2Desc` | `f3Desc` | `f4Desc` | `f5Desc` | `f6Desc` | `f7Desc` | `f8Desc`)}
              </p>

              {/* Bottom accent line on hover */}
              <div
                className="absolute bottom-0 left-6 right-6 h-0.5 scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100"
                style={{ backgroundColor: color, transformOrigin: 'left' }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
