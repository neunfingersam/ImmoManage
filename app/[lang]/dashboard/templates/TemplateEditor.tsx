'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { saveTemplateText, type TemplateTexts } from './_actions'

const PLACEHOLDERS: Record<string, string[]> = {
  mietvertrag: ['{mieterName}', '{mieterAdresse}', '{objektAdresse}', '{einheit}', '{startDatum}', '{kaltmiete}', '{nebenkosten}', '{kaution}', '{vermieterName}'],
  uebergabeprotokoll: ['{mieterName}', '{objektAdresse}', '{einheit}', '{datum}', '{vermieterName}'],
  kuendigung: ['{mieterName}', '{mieterAdresse}', '{objektAdresse}', '{einheit}', '{kuendigungsDatum}', '{vermieterName}'],
  nebenkostenabrechnung: ['{mieterName}', '{objektAdresse}', '{einheit}', '{zeitraum}', '{betrag}'],
  mahnung1: ['{mieterName}', '{monat}', '{betrag}', '{faelligAm}'],
  mahnung2: ['{mieterName}', '{monat}', '{betrag}', '{faelligAm}'],
  mahnung3: ['{mieterName}', '{monat}', '{betrag}', '{faelligAm}'],
}

const LOCALES = [
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
]

const TEMPLATE_NAMES: Record<string, string> = {
  mietvertrag: 'Mietvertrag',
  uebergabeprotokoll: 'Übergabeprotokoll',
  kuendigung: 'Kündigung',
  nebenkostenabrechnung: 'Nebenkostenabrechnung',
  mahnung1: 'Zahlungserinnerung (1. Mahnung)',
  mahnung2: '2. Mahnung',
  mahnung3: '3. Mahnung / Letzte Mahnung',
}

type Props = {
  templateKey: string
  icon: string
  initialTexts: TemplateTexts
  defaultTexts: Record<string, string>
}

export function TemplateEditor({ templateKey, icon, initialTexts, defaultTexts }: Props) {
  const [activeLocale, setActiveLocale] = useState('de')
  const [texts, setTexts] = useState<Record<string, string>>(() => {
    const saved = initialTexts[templateKey] ?? {}
    return Object.fromEntries(
      LOCALES.map(l => [l.code, saved[l.code] ?? defaultTexts[l.code] ?? ''])
    )
  })
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    setSaved(false)
    startTransition(async () => {
      await saveTemplateText(templateKey, activeLocale, texts[activeLocale])
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const placeholders = PLACEHOLDERS[templateKey] ?? []

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h3 className="font-semibold">{TEMPLATE_NAMES[templateKey]}</h3>
      </div>

      {/* Locale tabs */}
      <div className="flex gap-1 border-b border-border pb-2">
        {LOCALES.map(l => (
          <button
            key={l.code}
            onClick={() => setActiveLocale(l.code)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeLocale === l.code
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <textarea
        value={texts[activeLocale]}
        onChange={e => setTexts(t => ({ ...t, [activeLocale]: e.target.value }))}
        rows={8}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Vorlagentext eingeben…"
      />

      {/* Placeholders */}
      {placeholders.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {placeholders.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setTexts(t => ({ ...t, [activeLocale]: (t[activeLocale] ?? '') + p }))}
              className="text-xs border rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-mono"
              title="Platzhalter einfügen"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? 'Speichern…' : 'Speichern'}
        </Button>
        <a
          href={`/api/templates/${templateKey}?locale=${activeLocale}`}
          target="_blank"
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Vorschau PDF
        </a>
        {saved && <span className="text-xs text-green-600">Gespeichert ✓</span>}
      </div>
    </div>
  )
}
