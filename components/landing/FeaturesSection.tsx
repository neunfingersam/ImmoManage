import { useTranslations } from 'next-intl'
import { Building2, Users, CreditCard, MessageSquare, Sparkles, FileText } from 'lucide-react'

const features = [
  { key: 'f1', Icon: Building2 },
  { key: 'f2', Icon: Users },
  { key: 'f3', Icon: CreditCard },
  { key: 'f4', Icon: MessageSquare },
  { key: 'f5', Icon: Sparkles },
  { key: 'f6', Icon: FileText },
] as const

export default function FeaturesSection() {
  const t = useTranslations('landing.features')

  return (
    <section className="bg-[#FAFAF8] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="font-heading text-4xl font-bold text-[#1A1A2E] md:text-5xl">
            {t('title')}
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full" style={{ backgroundColor: '#E8734A' }} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ key, Icon }) => (
            <div
              key={key}
              className="group rounded-2xl bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{ border: '1px solid #E8734A10', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-colors group-hover:scale-110"
                style={{ backgroundColor: '#E8734A12' }}
              >
                <Icon className="h-6 w-6" style={{ color: '#E8734A' }} />
              </div>
              <h3 className="mb-2 font-semibold text-[#1A1A2E]">{t(`${key}Title`)}</h3>
              <p className="text-sm leading-relaxed text-[#1A1A2E]/55">{t(`${key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
