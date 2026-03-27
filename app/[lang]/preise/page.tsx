import { getTranslations } from 'next-intl/server'
import { Check, Minus } from 'lucide-react'
import LandingNav from '@/components/landing/LandingNav'
import LandingFooter from '@/components/landing/LandingFooter'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Preise – ImmoManage',
    description: 'Transparente Preise für Schweizer Immobilienverwaltung. Kein Abo-Falle, keine versteckten Kosten. Ab CHF 0/Monat.',
  }
}

const plans = [
  {
    key: 'starter',
    price: 0,
    priceNote: 'kostenlos',
    highlight: false,
    features: {
      properties: '1 Objekt',
      units: 'bis 4 Einheiten',
      users: '1 Benutzer',
      tenantPortal: true,
      tickets: true,
      documents: true,
      qrInvoice: false,
      taxFolder: false,
      aiAssistant: false,
      support: 'Community',
    },
  },
  {
    key: 'standard',
    price: 39,
    priceNote: 'pro Monat',
    highlight: false,
    features: {
      properties: 'bis 5 Objekte',
      units: 'bis 25 Einheiten',
      users: '2 Benutzer',
      tenantPortal: true,
      tickets: true,
      documents: true,
      qrInvoice: true,
      taxFolder: false,
      aiAssistant: false,
      support: 'E-Mail',
    },
  },
  {
    key: 'pro',
    price: 79,
    priceNote: 'pro Monat',
    highlight: true,
    features: {
      properties: 'unbegrenzt',
      units: 'unbegrenzt',
      users: 'bis 5 Benutzer',
      tenantPortal: true,
      tickets: true,
      documents: true,
      qrInvoice: true,
      taxFolder: true,
      aiAssistant: true,
      support: 'Priorität',
    },
  },
  {
    key: 'enterprise',
    price: null,
    priceNote: 'auf Anfrage',
    highlight: false,
    features: {
      properties: 'unbegrenzt',
      units: 'unbegrenzt',
      users: 'unbegrenzt',
      tenantPortal: true,
      tickets: true,
      documents: true,
      qrInvoice: true,
      taxFolder: true,
      aiAssistant: true,
      support: 'Dediziert',
    },
  },
]

const competitors = [
  { name: 'Fairwalter', price: '49–199', note: 'CH' },
  { name: 'Rimo R5', price: '59–299', note: 'CH' },
  { name: 'Garaio REM', price: '200+', note: 'Enterprise' },
  { name: 'ImmoManage', price: '0–79', note: '← Sie sind hier', highlight: true },
]

const featureLabels: Record<string, string> = {
  properties: 'Objekte',
  units: 'Einheiten',
  users: 'Benutzer',
  tenantPortal: 'Mieter-Portal',
  tickets: 'Schadensmeldungen',
  documents: 'Dokumente & Vorlagen',
  qrInvoice: 'QR-Rechnung (CH)',
  taxFolder: 'Steuermappe',
  aiAssistant: 'KI-Assistent',
  support: 'Support',
}

const planLabels: Record<string, string> = {
  starter: 'Starter',
  standard: 'Standard',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export default async function PreisePage() {
  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <LandingNav />

      {/* Hero */}
      <section className="py-16 md:py-24 text-center px-6">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-6"
          style={{ borderColor: '#E8734A40', color: '#E8734A', backgroundColor: '#E8734A10' }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Transparente Preise
        </span>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1A1A2E] mb-4">
          Keine Überraschungen. Keine Abo-Fallen.
        </h1>
        <p className="text-lg text-[#1A1A2E]/60 max-w-xl mx-auto mb-2">
          Alle Preise in CHF, inkl. MwSt. Monatlich kündbar.
        </p>
        <p className="text-sm text-[#1A1A2E]/40">
          Vergleich mit Marktbegleitern: ImmoManage ist bis zu 60% günstiger.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="pb-16 px-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className="relative rounded-2xl border p-6 flex flex-col"
              style={{
                borderColor: plan.highlight ? '#E8734A' : '#E8734A20',
                backgroundColor: plan.highlight ? '#fff' : '#fff',
                boxShadow: plan.highlight ? '0 8px 40px rgba(232,115,74,0.15)' : '0 2px 12px rgba(0,0,0,0.04)',
              }}
            >
              {plan.highlight && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: '#E8734A' }}
                >
                  Beliebteste Wahl
                </div>
              )}

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1A1A2E]/40 mb-2">
                  {planLabels[plan.key]}
                </p>
                <div className="flex items-baseline gap-1">
                  {plan.price !== null ? (
                    <>
                      <span className="text-4xl font-bold text-[#1A1A2E]">CHF {plan.price}</span>
                      <span className="text-sm text-[#1A1A2E]/50">/Mt.</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-[#1A1A2E]">Auf Anfrage</span>
                  )}
                </div>
                <p className="text-xs text-[#1A1A2E]/40 mt-1">{plan.priceNote}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-6">
                {Object.entries(plan.features).map(([key, value]) => (
                  <li key={key} className="flex items-start gap-2 text-sm text-[#1A1A2E]/70">
                    {typeof value === 'boolean' ? (
                      value ? (
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#E8734A' }} />
                      ) : (
                        <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#1A1A2E]/20" />
                      )
                    ) : (
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#E8734A' }} />
                    )}
                    <span>
                      <span className="text-[#1A1A2E]/40 text-xs">{featureLabels[key]}: </span>
                      {typeof value === 'boolean' ? (value ? 'Ja' : '—') : value}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#demo"
                className="block text-center rounded-xl py-2.5 text-sm font-semibold transition-all"
                style={
                  plan.highlight
                    ? { backgroundColor: '#E8734A', color: '#fff' }
                    : { backgroundColor: '#E8734A10', color: '#E8734A' }
                }
              >
                {plan.key === 'enterprise' ? 'Kontakt aufnehmen' : plan.price === 0 ? 'Kostenlos starten' : 'Demo anfragen'}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-[#1A1A2E] text-center mb-2">Marktvergleich</h2>
          <p className="text-sm text-center text-[#1A1A2E]/50 mb-8">Monatliche Kosten für eine typische Verwaltung mit 15–20 Einheiten (CHF)</p>
          <div className="overflow-hidden rounded-2xl border border-[#E8734A20]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8734A10] bg-[#E8734A05]">
                  <th className="text-left px-5 py-3 font-semibold text-[#1A1A2E]/60">Anbieter</th>
                  <th className="text-right px-5 py-3 font-semibold text-[#1A1A2E]/60">Preis / Monat</th>
                  <th className="text-right px-5 py-3 font-semibold text-[#1A1A2E]/60">Bemerkung</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <tr
                    key={c.name}
                    className="border-b last:border-0"
                    style={{
                      borderColor: '#E8734A10',
                      backgroundColor: c.highlight ? '#E8734A08' : i % 2 === 0 ? '#fff' : '#FAFAF8',
                    }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: c.highlight ? '#E8734A' : '#1A1A2E' }}>
                      {c.name}
                      {c.highlight && <span className="ml-2 text-xs bg-[#E8734A20] text-[#E8734A] rounded-full px-2 py-0.5">Sie</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-mono" style={{ color: c.highlight ? '#E8734A' : '#1A1A2E/70' }}>
                      CHF {c.price}
                    </td>
                    <td className="px-5 py-3 text-right text-[#1A1A2E]/40">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#1A1A2E]/30 text-center mt-3">* Preisangaben basieren auf öffentlich zugänglichen Informationen der Anbieter (Stand 2026). Ohne Gewähr.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 px-6 border-t border-[#E8734A10]">
        <div className="mx-auto max-w-2xl pt-16">
          <h2 className="text-2xl font-bold text-[#1A1A2E] text-center mb-10">Häufige Fragen</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Kann ich jederzeit kündigen?',
                a: 'Ja. Alle Pläne sind monatlich kündbar — ohne Kündigungsfristen oder Mindestlaufzeiten.',
              },
              {
                q: 'Gibt es versteckte Kosten?',
                a: 'Nein. Der angegebene Preis ist alles. Keine Setup-Gebühren, keine Pro-Einheit-Kosten.',
              },
              {
                q: 'Ist die QR-Rechnung wirklich CH-konform?',
                a: 'Ja. Wir generieren ISO 20022-konforme QR-Rechnungen mit Referenznummer (QRR) nach SIX-Standard.',
              },
              {
                q: 'Was passiert wenn ich mehr Einheiten bekomme?',
                a: 'Sie können jederzeit upgraden — der neue Plan gilt ab dem nächsten Monat.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-[#E8734A10] pb-6 last:border-0">
                <p className="font-semibold text-[#1A1A2E] mb-2">{q}</p>
                <p className="text-sm text-[#1A1A2E]/60 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />

      {/* JSON-LD for pricing page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'ImmoManage',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description: 'Schweizer Immobilienverwaltungssoftware für Hausverwaltungen und private Eigentümer',
            url: 'https://immo-manage.ch',
            offers: plans.filter(p => p.price !== null).map(p => ({
              '@type': 'Offer',
              name: planLabels[p.key],
              price: p.price,
              priceCurrency: 'CHF',
              billingIncrement: 'P1M',
              url: 'https://immo-manage.ch/de/preise',
            })),
          }),
        }}
      />
    </main>
  )
}
