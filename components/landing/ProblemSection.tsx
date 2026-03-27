import { useTranslations } from 'next-intl'

const items = [
  { key: 'item1', emoji: '📊', rotate: '-rotate-1' },
  { key: 'item2', emoji: '🧾', rotate: 'rotate-0' },
  { key: 'item3', emoji: '📞', rotate: 'rotate-1' },
] as const

export default function ProblemSection() {
  const t = useTranslations('landing.problem')

  return (
    <section className="bg-[#1A1A2E] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="font-heading text-4xl font-bold text-white md:text-5xl">
            {t('title')}
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full" style={{ backgroundColor: '#E8734A' }} />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map(({ key, emoji, rotate }) => (
            <div
              key={key}
              className={`${rotate} rounded-2xl p-8 transition-transform hover:rotate-0`}
              style={{ backgroundColor: '#ffffff08', border: '1px solid #ffffff10' }}
            >
              <div
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                style={{ backgroundColor: '#E8734A15', border: '1px solid #E8734A30' }}
              >
                {emoji}
              </div>
              <h3 className="mb-3 text-lg font-semibold text-white">
                {t(`${key}Title`)}
              </h3>
              <p className="leading-relaxed text-white/50">{t(`${key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
