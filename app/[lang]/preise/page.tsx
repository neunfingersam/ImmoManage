import LandingNav from '@/components/landing/LandingNav'
import LandingFooter from '@/components/landing/LandingFooter'
import PricingCards from './PricingCards'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Preise – ImmoManage',
    description: 'Transparente Preise für Schweizer Immobilienverwaltung. Kein Abo-Falle, keine versteckten Kosten. Ab CHF 0/Monat.',
  }
}

const competitors = [
  { name: 'Fairwalter', price: '49–199', note: 'CH' },
  { name: 'Rimo R5', price: '59–299', note: 'CH' },
  { name: 'Garaio REM', price: '200+', note: 'Enterprise' },
  { name: 'ImmoManage', price: '0–79', note: '← Sie sind hier', highlight: true },
]

export default function PreisePage() {
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

      {/* Pricing cards (interactive) */}
      <section className="pb-16 px-6">
        <div className="mx-auto max-w-6xl">
          <PricingCards />
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-[#1A1A2E] text-center mb-2">Marktvergleich</h2>
          <p className="text-sm text-center text-[#1A1A2E]/50 mb-8">
            Monatliche Kosten für eine typische Verwaltung mit 15–20 Einheiten (CHF)
          </p>
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
                      {c.highlight && (
                        <span className="ml-2 text-xs bg-[#E8734A20] text-[#E8734A] rounded-full px-2 py-0.5">Sie</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono" style={{ color: c.highlight ? '#E8734A' : undefined }}>
                      CHF {c.price}
                    </td>
                    <td className="px-5 py-3 text-right text-[#1A1A2E]/40">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#1A1A2E]/30 text-center mt-3">
            * Preisangaben basieren auf öffentlich zugänglichen Informationen der Anbieter (Stand 2026). Ohne Gewähr.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 px-6 border-t border-[#E8734A10]">
        <div className="mx-auto max-w-2xl pt-16">
          <h2 className="text-2xl font-bold text-[#1A1A2E] text-center mb-10">Häufige Fragen</h2>
          <div className="space-y-6">
            {[
              { q: 'Kann ich jederzeit kündigen?', a: 'Ja. Alle Pläne sind monatlich kündbar — ohne Kündigungsfristen oder Mindestlaufzeiten.' },
              { q: 'Gibt es versteckte Kosten?', a: 'Nein. Der angegebene Preis ist alles. Keine Setup-Gebühren, keine Pro-Einheit-Kosten.' },
              { q: 'Ist die QR-Rechnung wirklich CH-konform?', a: 'Ja. Wir generieren ISO 20022-konforme QR-Rechnungen mit Referenznummer (QRR) nach SIX-Standard.' },
              { q: 'Was passiert wenn ich mehr Einheiten bekomme?', a: 'Sie können jederzeit upgraden — der neue Plan gilt ab dem nächsten Monat.' },
              { q: 'Wie schnell werde ich nach der Anfrage kontaktiert?', a: 'Wir melden uns innerhalb von 24 Stunden. Ihr Account wird nach Bestätigung sofort eingerichtet.' },
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'ImmoManage',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: [
              { '@type': 'Offer', name: 'Starter', price: '0', priceCurrency: 'CHF' },
              { '@type': 'Offer', name: 'Standard', price: '39', priceCurrency: 'CHF' },
              { '@type': 'Offer', name: 'Pro', price: '79', priceCurrency: 'CHF' },
            ],
          }),
        }}
      />
    </main>
  )
}
