// app/[lang]/dashboard/templates/page.tsx
import { getTranslations } from 'next-intl/server'

const TEMPLATES = [
  { key: 'mietvertrag', icon: '📄' },
  { key: 'uebergabeprotokoll', icon: '🏠' },
  { key: 'kuendigung', icon: '📮' },
  { key: 'nebenkostenabrechnung', icon: '🧾' },
  { key: 'mahnung1', icon: '⚠️' },
  { key: 'mahnung2', icon: '🔴' },
  { key: 'mahnung3', icon: '🚨' },
] as const

const LOCALES = [
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'it', label: 'IT' },
]

export default async function TemplatesPage() {
  const t = await getTranslations('templates')

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl text-foreground">{t('title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map(({ key, icon }) => (
          <div key={key} className="border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{icon}</span>
              <h3 className="font-semibold">{t(key as never)}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {LOCALES.map(({ code, label }) => (
                <a
                  key={code}
                  href={`/api/templates/${key}?locale=${code}`}
                  target="_blank"
                  className="text-xs border rounded-lg px-2 py-1 hover:bg-muted transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* Data import template */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📥</span>
            <h3 className="font-semibold">{t('importVorlage')}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{t('importVorlageDesc')}</p>
          <a
            href="/templates/import-vorlage.xlsx"
            download
            className="inline-flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors font-medium"
          >
            ↓ import-vorlage.xlsx
          </a>
        </div>
      </div>
    </div>
  )
}
