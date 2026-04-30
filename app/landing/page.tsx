'use client'

import { useState, useEffect } from 'react'
import { translations, type Locale } from './translations'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Suggestion {
  id: string
  title: string
  category: string
  description: string
  name: string
  email: string
  votes: number
  votedBy: string[]
  createdAt: string
}

interface FeedbackT {
  buttonTitle: string; modalTitle: string; tab1: string; tab2: string
  titleLabel: string; titlePlaceholder: string; categoryLabel: string
  descLabel: string; descPlaceholder: string; nameLabel: string
  emailLabel: string; submit: string; submitting: string
  successMsg: string; noSuggestions: string; vote: string
  categories: readonly string[]
}

interface ContactT {
  title: string; subtitle: string; nameLabel: string; emailLabel: string
  messageLabel: string; consentLabel: string; submit: string
  submitting: string; successMsg: string; errorMsg: string
}

// ─── Features (implemented vs coming soon) ────────────────────────────────────

const FEATURES = [
  { icon: '🏘️', key: 'tenants',     live: true  },
  { icon: '📄', key: 'documents',   live: true  },
  { icon: '🔧', key: 'tickets',     live: true  },
  { icon: '💶', key: 'billing',     live: true  },
  { icon: '💬', key: 'messaging',   live: true  },
  { icon: '📅', key: 'calendar',    live: true  },
  { icon: '🧾', key: 'qr',         live: true  },
  { icon: '🏗️', key: 'weg',         live: true  },
  { icon: '🤖', key: 'ai',          live: false },
  { icon: '⚠️', key: 'reminders',   live: false },
  { icon: '📊', key: 'taxes',       live: false },
]

const FEATURE_CONTENT: Record<string, Record<Locale, { title: string; desc: string }>> = {
  tenants:   { de: { title: 'Mieterverwaltung',      desc: 'Mieter anlegen, einladen, Verträge verwalten. Alle Daten zentral.' },
               fr: { title: 'Gestion des locataires', desc: 'Créez, invitez, gérez vos locataires et leurs contrats.' },
               it: { title: 'Gestione affittuari',    desc: 'Crea, invita, gestisci affittuari e contratti.' },
               en: { title: 'Tenant management',      desc: 'Create, invite, manage tenants and leases centrally.' } },
  documents: { de: { title: 'Dokumente & Portale',   desc: 'Mietverträge, Hausordnung, Abrechnungen – sicher gespeichert und abrufbar.' },
               fr: { title: 'Documents & Portails',  desc: 'Contrats, règlements, décomptes – stockés et accessibles.' },
               it: { title: 'Documenti & Portali',   desc: 'Contratti, regolamenti, rendiconti – archiviati e accessibili.' },
               en: { title: 'Documents & Portals',   desc: 'Leases, house rules, invoices – securely stored and accessible.' } },
  tickets:   { de: { title: 'Schadensmeldungen',     desc: 'Mieter melden Schäden digital mit Fotos. Statusverfolgung in Echtzeit.' },
               fr: { title: 'Signalement de dommages', desc: 'Les locataires signalent les dommages avec photos. Suivi en temps réel.' },
               it: { title: 'Segnalazione danni',    desc: 'Gli affittuari segnalano danni con foto. Tracciamento in tempo reale.' },
               en: { title: 'Damage reports',        desc: 'Tenants report damage with photos. Real-time status tracking.' } },
  billing:   { de: { title: 'Nebenkostenabrechnung', desc: 'Rechtssichere Abrechnungen auf Knopfdruck. PDF-Export inklusive.' },
               fr: { title: 'Décompte de charges',   desc: 'Décomptes conformes en un clic. Export PDF inclus.' },
               it: { title: 'Rendiconto spese',      desc: 'Rendiconti conformi in un clic. Export PDF incluso.' },
               en: { title: 'Utility billing',       desc: 'Compliant utility bills at the click of a button. PDF export included.' } },
  messaging: { de: { title: 'Direktnachrichten',     desc: 'Sichere Kommunikation zwischen Vermieter und Mieter. Keine E-Mail-Flut.' },
               fr: { title: 'Messagerie directe',    desc: 'Communication sécurisée entre propriétaire et locataire.' },
               it: { title: 'Messaggistica diretta', desc: 'Comunicazione sicura tra proprietario e affittuario.' },
               en: { title: 'Direct messaging',      desc: 'Secure landlord–tenant communication. No email flood.' } },
  calendar:  { de: { title: 'Kalender & Fristen',    desc: 'Vertragsenden, Ablesungen, Wartungen – automatische Erinnerungen.' },
               fr: { title: 'Calendrier & Échéances', desc: 'Fins de contrat, relevés, entretiens – rappels automatiques.' },
               it: { title: 'Calendario & Scadenze', desc: 'Fine contratto, letture, manutenzioni – promemoria automatici.' },
               en: { title: 'Calendar & Deadlines',  desc: 'Contract ends, readings, maintenance – automatic reminders.' } },
  qr:        { de: { title: 'QR-Rechnungen (CH)',    desc: 'Schweizer QR-Zahlschein-Standard. Direkt aus der App generieren.' },
               fr: { title: 'Factures QR (CH)',      desc: 'Standard suisse de bulletin de paiement QR. Directement depuis l\'app.' },
               it: { title: 'Fatture QR (CH)',       desc: 'Standard svizzero di bollettino QR. Direttamente dall\'app.' },
               en: { title: 'QR Invoices (CH)',      desc: 'Swiss QR payment slip standard. Generated directly from the app.' } },
  weg:       { de: { title: 'WEG-Verwaltung',         desc: 'Stockwerkeigentum: Versammlungen, Abrechnungen, Eigentümerportal.' },
               fr: { title: 'Gestion PPE',           desc: 'Propriété par étages: assemblées, décomptes, portail propriétaires.' },
               it: { title: 'Gestione PPP',          desc: 'Proprietà a piani: assemblee, rendiconti, portale proprietari.' },
               en: { title: 'Strata management',     desc: 'Strata title: meetings, statements, owner portal.' } },
  ai:        { de: { title: 'KI-Assistent',           desc: 'Beantwortet Mieterfragen automatisch per RAG auf Basis ihrer Dokumente.' },
               fr: { title: 'Assistant IA',          desc: 'Répond aux questions des locataires automatiquement via RAG.' },
               it: { title: 'Assistente IA',         desc: 'Risponde alle domande degli affittuari automaticamente via RAG.' },
               en: { title: 'AI assistant',          desc: 'Answers tenant questions automatically via RAG based on their documents.' } },
  reminders: { de: { title: 'Automatische Mahnungen', desc: 'Zahlungserinnerungen und Mahnungen werden automatisch versandt.' },
               fr: { title: 'Rappels automatiques',  desc: 'Rappels de paiement et relances envoyés automatiquement.' },
               it: { title: 'Promemoria automatici', desc: 'Promemoria di pagamento e solleciti inviati automaticamente.' },
               en: { title: 'Automatic reminders',   desc: 'Payment reminders and dunning notices sent automatically.' } },
  taxes:     { de: { title: 'Steuerbelege-Export',    desc: 'Automatische Aufbereitung aller relevanten Belege für die Steuererklärung.' },
               fr: { title: 'Export fiscal',         desc: 'Préparation automatique de tous les justificatifs pour la déclaration d\'impôts.' },
               it: { title: 'Export fiscale',        desc: 'Preparazione automatica di tutti i documenti per la dichiarazione fiscale.' },
               en: { title: 'Tax export',            desc: 'Automatic preparation of all relevant documents for tax returns.' } },
}

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'it', label: 'IT' },
]

const CORAL = '#E8734A'
const BG = '#FDF8F4'

let _deviceId: string | null = null
function getDeviceId() {
  if (typeof window === 'undefined') return 'server'
  if (!_deviceId) {
    _deviceId = localStorage.getItem('immo_device_id') ?? Math.random().toString(36).slice(2)
    localStorage.setItem('immo_device_id', _deviceId)
  }
  return _deviceId
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [locale, setLocale] = useState<Locale>('de')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('immo_locale') as Locale | null
    if (saved && ['de', 'fr', 'it', 'en'].includes(saved)) setLocale(saved)
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const changeLocale = (l: Locale) => {
    setLocale(l)
    localStorage.setItem('immo_locale', l)
    setMobileMenuOpen(false)
  }

  const t = translations[locale]
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  const label = {
    de: { live: 'Verfügbar', soon: 'Coming Soon', features: 'Funktionen', pricing: 'Preise',
          login: 'Anmelden', cta: 'Gratis testen', trust: ['Keine Kreditkarte', 'Schweizer Server', 'Monatlich kündbar'],
          painTitle: 'Kennen Sie das?', painLabel: 'DER ALTE WEG',
          painSub: 'Was Hausverwalter täglich Zeit, Nerven und Geld kostet — und längst gelöst sein sollte.',
          pains: ['Tabellen und Excel-Chaos für Miet- und Nebenkosten', 'Dokumente per E-Mail hin- und herschicken', 'Mieter rufen wegen jeder Kleinigkeit an', 'Fristen verpassen weil alles im Kopf gespeichert ist', 'Stundenlange Nebenkostenabrechnungen manuell erstellen'],
          solutionLabel: 'DIE LÖSUNG', solutionTitle: 'ImmoManage macht Schluss damit.',
          solutionSub: 'Alles was ein Vermieter braucht — in einer einzigen Schweizer Software.',
        },
    fr: { live: 'Disponible', soon: 'Coming Soon', features: 'Fonctionnalités', pricing: 'Tarifs',
          login: 'Connexion', cta: 'Essai gratuit', trust: ['Sans carte de crédit', 'Serveur suisse', 'Résiliable mensuellement'],
          painTitle: 'Vous connaissez ça?', painLabel: 'L\'ANCIENNE MÉTHODE',
          painSub: 'Ce qui coûte du temps, des nerfs et de l\'argent aux gérants immobiliers chaque jour.',
          pains: ['Tableaux Excel pour loyers et charges', 'Documents envoyés par e-mail', 'Locataires qui appellent pour tout', 'Délais oubliés car tout est en tête', 'Décomptes de charges manuels et chronophages'],
          solutionLabel: 'LA SOLUTION', solutionTitle: 'ImmoManage en finit avec ça.',
          solutionSub: 'Tout ce dont un propriétaire a besoin — dans un seul logiciel suisse.',
        },
    it: { live: 'Disponibile', soon: 'Coming Soon', features: 'Funzionalità', pricing: 'Prezzi',
          login: 'Accedi', cta: 'Prova gratuita', trust: ['Senza carta di credito', 'Server svizzero', 'Annullabile mensilmente'],
          painTitle: 'La riconosci?', painLabel: 'IL VECCHIO MODO',
          painSub: 'Quello che costa tempo, nervi e denaro ai gestori immobiliari ogni giorno.',
          pains: ['Fogli Excel per affitti e spese', 'Documenti inviati via e-mail', 'Affittuari che chiamano per tutto', 'Scadenze dimenticate perché tutto è in testa', 'Rendiconti spese manuali e lunghi'],
          solutionLabel: 'LA SOLUZIONE', solutionTitle: 'ImmoManage mette fine a tutto ciò.',
          solutionSub: 'Tutto ciò di cui un proprietario ha bisogno — in un unico software svizzero.',
        },
    en: { live: 'Available', soon: 'Coming Soon', features: 'Features', pricing: 'Pricing',
          login: 'Sign in', cta: 'Try for free', trust: ['No credit card', 'Swiss server', 'Cancel anytime'],
          painTitle: 'Sound familiar?', painLabel: 'THE OLD WAY',
          painSub: 'What costs property managers time, nerves and money every day — and should have been solved long ago.',
          pains: ['Spreadsheet chaos for rents and utilities', 'Documents sent back and forth by email', 'Tenants calling about every little thing', 'Missing deadlines because everything is in your head', 'Hours spent creating utility bills manually'],
          solutionLabel: 'THE SOLUTION', solutionTitle: 'ImmoManage puts an end to all that.',
          solutionSub: 'Everything a landlord needs — in one Swiss software.',
        },
  }

  const lbl = label[locale]

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: BG, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${BG}; }
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .hover-lift { transition: transform .2s, box-shadow .2s; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,.1); }
        .nav-link-item { position: relative; cursor: pointer; font-size: 14px; font-weight: 500; color: #374151; background: none; border: none; padding: 4px 0; }
        .nav-link-item::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 2px; background: ${CORAL}; transition: width .2s; }
        .nav-link-item:hover::after { width: 100%; }
        .nav-link-item:hover { color: #1a1a2e; }
        .fade-up { animation: fadeUp .6s ease forwards; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .delay-1 { animation-delay: .1s; opacity: 0; }
        .delay-2 { animation-delay: .22s; opacity: 0; }
        .delay-3 { animation-delay: .34s; opacity: 0; }
        .delay-4 { animation-delay: .46s; opacity: 0; }
        .mockup-window { background: #1e2533; border-radius: 12px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.1); }
        .mockup-topbar { background: #2a3142; padding: 10px 14px; display: flex; align-items: center; gap: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-r { background: #ff5f57; } .dot-y { background: #febc2e; } .dot-g { background: #28c840; }
        .mockup-url { flex: 1; background: #1e2533; border-radius: 4px; padding: 3px 10px; font-size: 11px; color: #9ca3af; margin-left: 8px; }
        .sidebar { background: #1e2533; width: 140px; padding: 12px 0; flex-shrink: 0; }
        .sidebar-item { padding: 7px 14px; font-size: 11px; color: #9ca3af; display: flex; align-items: center; gap: 6px; cursor: default; }
        .sidebar-item.active { background: rgba(232,115,74,.15); color: ${CORAL}; border-right: 2px solid ${CORAL}; }
        .main-content { flex: 1; padding: 16px; background: #f8f9fa; overflow: hidden; }
        .stat-box { background: white; border-radius: 8px; padding: 10px 12px; border: 1px solid #e5e7eb; }
        .stat-val { font-size: 18px; font-weight: 700; color: #1a1a2e; }
        .stat-lbl { font-size: 9px; color: #9ca3af; margin-top: 2px; }
        .ticket-row { display: flex; align-items: center; gap: 6px; padding: 5px 8px; background: white; border-radius: 6px; margin-bottom: 4px; border: 1px solid #f0f0f0; font-size: 10px; }
        .badge { padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
        .badge-red { background: rgba(239,68,68,.1); color: #ef4444; }
        .badge-green { background: rgba(34,197,94,.1); color: #16a34a; }
        .badge-yellow { background: rgba(234,179,8,.1); color: #ca8a04; }
        .pain-item { display: flex; align-items: flex-start; gap: 12px; padding: 16px 0; border-bottom: 1px solid #e8dfd6; }
        .pain-icon { width: 32px; height: 32px; border-radius: 50%; background: rgba(232,115,74,.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; }
        .feature-card { background: white; border-radius: 16px; padding: 20px; border: 1px solid #ede8e2; transition: all .2s; cursor: default; }
        .feature-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,.08); border-color: ${CORAL}40; }
        .live-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; background: rgba(34,197,94,.1); color: #15803d; }
        .soon-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; background: rgba(99,102,241,.1); color: #4f46e5; }
        .btn-coral { background: ${CORAL}; color: white; border: none; cursor: pointer; border-radius: 8px; font-weight: 600; transition: opacity .15s, transform .15s; }
        .btn-coral:hover { opacity: .92; transform: translateY(-1px); }
        .btn-outline { background: transparent; color: #374151; border: 1.5px solid #d1cdc8; cursor: pointer; border-radius: 8px; font-weight: 600; transition: all .15s; }
        .btn-outline:hover { border-color: ${CORAL}; color: ${CORAL}; }
        .pricing-card { background: white; border-radius: 20px; padding: 28px; border: 1.5px solid #ede8e2; transition: all .2s; }
        .pricing-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,.1); }
        .pricing-card.featured { border-color: ${CORAL}; background: ${CORAL}; color: white; }
        .testimonial-card { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-radius: 16px; padding: 24px; }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; padding: 16px; animation: fadeIn .2s ease; }
        @media (min-width: 640px) { .modal-bg { align-items: center; } }
        .modal-box { background: white; border-radius: 20px; width: 100%; max-width: 460px; overflow: hidden; max-height: 90vh; animation: slideUp .3s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .float-anim { animation: floatBtn 3s ease-in-out infinite; }
        @keyframes floatBtn { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>

      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(253,248,244,.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #ede8e2' : 'none',
        transition: 'all .3s',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 64, gap: 24 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => scrollTo('hero')}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: CORAL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 14V7L8 2l6 5v7H10V9H6v5H2Z" fill="white"/></svg>
            </div>
            <span className="serif" style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>ImmoManage</span>
          </div>

          {/* Desktop Links */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 28 }} className="hidden-mobile">
            <button className="nav-link-item" onClick={() => scrollTo('features')}>{lbl.features}</button>
            <button className="nav-link-item" onClick={() => scrollTo('pricing')}>{lbl.pricing}</button>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Language switcher */}
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => changeLocale(l.code)}
                style={{
                  padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: locale === l.code ? CORAL : 'transparent',
                  color: locale === l.code ? 'white' : '#9ca3af',
                  transition: 'all .15s',
                }}
              >
                {l.label}
              </button>
            ))}
            <span style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 4px' }} />
            <button className="nav-link-item">{lbl.login}</button>
            <button
              className="btn-coral"
              style={{ padding: '8px 18px', fontSize: 14, minHeight: 36 }}
              onClick={() => setContactOpen(true)}
            >
              {lbl.cta} →
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section id="hero" style={{ maxWidth: 1160, margin: '0 auto', padding: '120px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
        <div>
          <div className="fade-up" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
            border: `1px solid ${CORAL}40`, borderRadius: 999, marginBottom: 28,
            background: `${CORAL}10`, color: CORAL, fontSize: 13, fontWeight: 600,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: CORAL, display: 'inline-block' }} />
            {locale === 'de' ? 'Für die Schweiz gebaut' : locale === 'fr' ? 'Conçu pour la Suisse' : locale === 'it' ? 'Fatto per la Svizzera' : 'Built for Switzerland'}
          </div>

          <h1 className="serif fade-up delay-1" style={{ fontSize: 'clamp(38px, 5vw, 58px)', lineHeight: 1.08, color: '#1a1a2e', marginBottom: 0 }}>
            {locale === 'de' ? <>Schluss mit<br />Zettelwirtschaft.</> :
             locale === 'fr' ? <>Fini le chaos<br />administratif.</> :
             locale === 'it' ? <>Basta con il<br />caos cartaceo.</> :
                               <>No more<br />paper chaos.</>}
          </h1>
          <h1 className="serif fade-up delay-2" style={{ fontSize: 'clamp(38px, 5vw, 58px)', lineHeight: 1.08, color: CORAL, marginBottom: 24 }}>
            {locale === 'de' ? 'Automatisch verwaltet.' :
             locale === 'fr' ? 'Géré automatiquement.' :
             locale === 'it' ? 'Gestito automaticamente.' :
                               'Managed automatically.'}
          </h1>
          <p className="fade-up delay-3" style={{ fontSize: 17, color: '#6b6860', lineHeight: 1.65, maxWidth: 460, marginBottom: 36 }}>
            {locale === 'de' ? 'Die Schweizer Hausverwaltungs-Software für Profis und private Eigentümer — von Mietvertrag bis QR-Rechnung, alles an einem Ort.' :
             locale === 'fr' ? 'Le logiciel suisse de gestion immobilière pour professionnels et propriétaires privés — du contrat de bail à la facture QR, tout en un seul endroit.' :
             locale === 'it' ? 'Il software svizzero di gestione immobiliare per professionisti e privati — dal contratto d\'affitto alla fattura QR, tutto in un unico posto.' :
                               'The Swiss property management software for professionals and private owners — from lease to QR invoice, everything in one place.'}
          </p>

          <div className="fade-up delay-4" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
            <button className="btn-coral" style={{ padding: '14px 28px', fontSize: 15, minHeight: 48 }} onClick={() => setContactOpen(true)}>
              {lbl.cta} →
            </button>
          </div>

          {/* Trust signals */}
          <div className="fade-up delay-4" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {lbl.trust.map((item, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9ca3af' }}>
                <span style={{ color: CORAL, fontSize: 12 }}>{i === 0 ? '×' : i === 1 ? '◎' : '⇄'}</span>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* App Mockup */}
        <div className="fade-up delay-2" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: -20, background: `radial-gradient(ellipse at center, ${CORAL}18 0%, transparent 70%)`, zIndex: 0 }} />
          <div className="mockup-window" style={{ position: 'relative', zIndex: 1 }}>
            {/* Browser top bar */}
            <div className="mockup-topbar">
              <div className="dot dot-r" /><div className="dot dot-y" /><div className="dot dot-g" />
              <div className="mockup-url">immo-manage.ch/dashboard</div>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: CORAL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700, marginLeft: 8 }}>A</div>
            </div>
            {/* App body */}
            <div style={{ display: 'flex', height: 340 }}>
              {/* Sidebar */}
              <div className="sidebar">
                <div style={{ padding: '8px 14px 12px', fontSize: 10, color: '#6b7280', fontWeight: 600, letterSpacing: 1 }}>Demo GmbH</div>
                {[
                  { icon: '⊞', label: 'Dashboard', active: true },
                  { icon: '🏘', label: 'Mieter' },
                  { icon: '🔑', label: 'Einheiten' },
                  { icon: '📋', label: 'Mietverträge' },
                  { icon: '💶', label: 'Zahlungen' },
                  { icon: '🔧', label: 'Schadensmeld.' },
                  { icon: '📄', label: 'Nachrichten' },
                  { icon: '📅', label: 'Kalender' },
                  { icon: '📁', label: 'Dokumente' },
                  { icon: '🧾', label: 'Steuermappen' },
                ].map((item) => (
                  <div key={item.label} className={`sidebar-item${item.active ? ' active' : ''}`}>
                    <span>{item.icon}</span><span>{item.label}</span>
                  </div>
                ))}
              </div>
              {/* Main dashboard content */}
              <div className="main-content">
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginBottom: 2 }}>Guten Tag, Anna</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 12 }}>Hier ist deine aktuelle Übersicht.</div>
                {/* Stat row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
                  {[
                    { val: "CHF 18'170", lbl: 'Einnahmen/Mon.', color: '#1a1a2e' },
                    { val: '73%', lbl: 'Belegungsrate', color: '#16a34a' },
                    { val: "CHF 8'380", lbl: '2 Fällige Rech.', color: CORAL },
                    { val: '4', lbl: 'Offene Tickets', color: '#9ca3af' },
                  ].map((s) => (
                    <div key={s.lbl} className="stat-box">
                      <div className="stat-val" style={{ color: s.color, fontSize: 13 }}>{s.val}</div>
                      <div className="stat-lbl">{s.lbl}</div>
                    </div>
                  ))}
                </div>
                {/* Tickets */}
                <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Offene Tickets</div>
                {[
                  { title: 'Wasserfleck Decke', addr: 'Rütistr. 3a', badge: 'badge-red', status: 'HOCH' },
                  { title: 'Waschmaschine Küche', addr: 'Rütistr. 3a', badge: 'badge-yellow', status: 'MITTEL' },
                  { title: 'Aussenleuchte defekt', addr: 'Seestrasse 12', badge: 'badge-green', status: 'TIEF' },
                  { title: 'Heizung funktioniert nicht', addr: 'Rütistr. 3a', badge: 'badge-red', status: 'HOCH' },
                ].map((ticket) => (
                  <div key={ticket.title} className="ticket-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.title}</div>
                      <div style={{ fontSize: 9, color: '#9ca3af' }}>{ticket.addr}</div>
                    </div>
                    <span className={`badge ${ticket.badge}`}>{ticket.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pain section ─────────────────────────────────────────────────────── */}
      <section style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: CORAL, marginBottom: 12 }}>{lbl.painLabel}</div>
          <h2 className="serif" style={{ fontSize: 'clamp(32px, 4vw, 46px)', color: '#1a1a2e', marginBottom: 12 }}>{lbl.painTitle}</h2>
          <p style={{ color: '#6b6860', fontSize: 16, lineHeight: 1.6, marginBottom: 40 }}>{lbl.painSub}</p>
          <div style={{ textAlign: 'left', maxWidth: 520, margin: '0 auto' }}>
            {lbl.pains.map((pain, i) => (
              <div key={i} className="pain-item">
                <div className="pain-icon">✗</div>
                <span style={{ color: '#374151', fontSize: 15, lineHeight: 1.5 }}>{pain}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '80px 24px', background: BG }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: CORAL, marginBottom: 12 }}>{lbl.solutionLabel}</div>
            <h2 className="serif" style={{ fontSize: 'clamp(30px, 4vw, 44px)', color: '#1a1a2e', marginBottom: 12 }}>{lbl.solutionTitle}</h2>
            <p style={{ color: '#6b6860', fontSize: 16 }}>{lbl.solutionSub}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {FEATURES.map((f) => {
              const content = FEATURE_CONTENT[f.key][locale]
              return (
                <div key={f.key} className="feature-card hover-lift" style={{ opacity: f.live ? 1 : 0.82 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: f.live ? `${CORAL}15` : 'rgba(99,102,241,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {f.icon}
                    </div>
                    {f.live
                      ? <span className="live-badge"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />{lbl.live}</span>
                      : <span className="soon-badge">⏳ {lbl.soon}</span>
                    }
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e', marginBottom: 6 }}>{content.title}</div>
                  <div style={{ fontSize: 13, color: '#6b6860', lineHeight: 1.55 }}>{content.desc}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 className="serif" style={{ fontSize: 'clamp(30px, 4vw, 44px)', color: '#1a1a2e', marginBottom: 10 }}>{t.pricing.title}</h2>
            <p style={{ color: '#6b6860', fontSize: 16 }}>{t.pricing.subtitle}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'start' }}>
            {t.pricing.plans.map((plan, i) => (
              <div key={i} className="hover-lift" style={{
                position: 'relative', background: 'white', borderRadius: 20, padding: 28,
                border: plan.highlight ? `2px solid ${CORAL}` : '1.5px solid #ede8e2',
                transition: 'all .2s',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: CORAL, color: 'white', fontSize: 12, fontWeight: 700,
                    padding: '5px 16px', borderRadius: 999, whiteSpace: 'nowrap',
                  }}>
                    {t.pricing.popular}
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: '#1a1a2e' }}>{plan.name}</div>
                <div className="serif" style={{ fontSize: 40, fontWeight: 700, color: CORAL, marginBottom: 0, lineHeight: 1.1 }}>
                  {plan.price}
                  <span style={{ fontSize: 15, fontWeight: 400, color: '#9ca3af' }}> {t.pricing.month}</span>
                </div>
                {'promo' in plan && plan.promo && (
                  <div style={{ display: 'inline-block', marginTop: 8, marginBottom: 12, padding: '3px 10px', borderRadius: 6, background: `${CORAL}15`, color: CORAL, fontSize: 12, fontWeight: 600 }}>
                    {plan.promo as string}
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#6b6860', marginBottom: 20 }}>{plan.desc}</div>
                <ul style={{ listStyle: 'none', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                      <span style={{ color: CORAL, fontSize: 13, flexShrink: 0, fontWeight: 700 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setContactOpen(true)}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44,
                    background: plan.highlight ? CORAL : 'white',
                    color: plan.highlight ? 'white' : CORAL,
                    border: `1.5px solid ${plan.highlight ? CORAL : '#ede8e2'}`,
                    transition: 'opacity .15s',
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section id="testimonials" style={{ padding: '80px 24px', background: '#1a1a2e' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: 'white', marginBottom: 10 }}>{t.testimonials.title}</h2>
            <p style={{ color: '#9ca3af', fontSize: 15 }}>{t.testimonials.subtitle}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {t.testimonials.items.map((item, i) => (
              <div key={i} className="testimonial-card hover-lift">
                <div style={{ display: 'flex', marginBottom: 10 }}>
                  {[1,2,3,4,5].map((s) => <span key={s} style={{ color: CORAL, fontSize: 14 }}>★</span>)}
                </div>
                <p style={{ color: '#d1d5db', fontSize: 14, lineHeight: 1.65, fontStyle: 'italic', marginBottom: 18 }}>"{item.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: CORAL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 14 }}>
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                    <div style={{ color: '#9ca3af', fontSize: 12 }}>{item.role} · {item.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: BG, textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#1a1a2e', marginBottom: 14 }}>
            {locale === 'de' ? 'Bereit loszulegen?' : locale === 'fr' ? 'Prêt à commencer?' : locale === 'it' ? 'Pronto per iniziare?' : 'Ready to get started?'}
          </h2>
          <p style={{ color: '#6b6860', fontSize: 16, marginBottom: 28 }}>
            {locale === 'de' ? 'Kostenlos starten, jederzeit upgraden.' : locale === 'fr' ? 'Commencez gratuitement, upgradez à tout moment.' : locale === 'it' ? 'Inizia gratuitamente, aggiorna quando vuoi.' : 'Start for free, upgrade anytime.'}
          </p>
          <button className="btn-coral" style={{ padding: '16px 36px', fontSize: 16, minHeight: 52, borderRadius: 12 }} onClick={() => setContactOpen(true)}>
            {lbl.cta} →
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#111827', padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: CORAL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 14V7L8 2l6 5v7H10V9H6v5H2Z" fill="white"/></svg>
            </div>
            <span className="serif" style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>ImmoManage</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {t.footer.links.map((link, i) => (
              <a key={i} href="#" onClick={(e) => e.preventDefault()} style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>{link}</a>
            ))}
          </div>
          <div style={{ color: '#4b5563', fontSize: 12 }}>{t.footer.copyright}</div>
        </div>
      </footer>

      {/* ── Floating Feedback Button ──────────────────────────────────────────── */}
      <button
        onClick={() => setFeedbackOpen(true)}
        className="float-anim"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '11px 20px', borderRadius: 999,
          fontWeight: 600, fontSize: 14, color: 'white',
          background: CORAL, border: 'none', cursor: 'pointer',
          minHeight: 44, boxShadow: `0 8px 30px ${CORAL}60`,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <span style={{ fontSize: 16 }}>💡</span>
        <span>{t.feedback.buttonTitle}</span>
      </button>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {feedbackOpen && <FeedbackModal locale={locale} t={t.feedback} onClose={() => setFeedbackOpen(false)} />}
      {contactOpen && <ContactModal locale={locale} t={t.contact} onClose={() => setContactOpen(false)} />}
    </div>
  )
}

// ─── Feedback Modal ────────────────────────────────────────────────────────────

function FeedbackModal({ locale, t, onClose }: { locale: Locale; t: FeedbackT; onClose: () => void }) {
  const [tab, setTab] = useState<'submit' | 'all'>('submit')
  const [form, setForm] = useState({ title: '', category: '', description: '', name: '', email: '' })
  const [submitted, setSubmitted] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('immo_suggestions')
    if (saved) setSuggestions(JSON.parse(saved))
  }, [])

  const save = (items: Suggestion[]) => {
    setSuggestions(items)
    localStorage.setItem('immo_suggestions', JSON.stringify(items))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.category || !form.description) return
    const item: Suggestion = { id: Date.now().toString(), ...form, votes: 0, votedBy: [], createdAt: new Date().toISOString() }
    save([item, ...suggestions])
    setSubmitted(true)
    setTimeout(() => { setSubmitted(false); setForm({ title: '', category: '', description: '', name: '', email: '' }); setTab('all') }, 1800)
  }

  const handleVote = (id: string) => {
    const did = getDeviceId()
    save(suggestions.map((s) => s.id !== id || s.votedBy.includes(did) ? s : { ...s, votes: s.votes + 1, votedBy: [...s.votedBy, did] }))
  }

  const sorted = [...suggestions].sort((a, b) => b.votes - a.votes)

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0ece7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{t.modalTitle}</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', background: '#f3f0ec', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b6860', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #f0ece7' }}>
          {(['submit', 'all'] as const).map((tb) => (
            <button key={tb} onClick={() => setTab(tb)} style={{
              flex: 1, padding: '12px 0', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
              color: tab === tb ? CORAL : '#9ca3af',
              borderBottom: `2px solid ${tab === tb ? CORAL : 'transparent'}`,
            }}>
              {tb === 'submit' ? t.tab1 : `${t.tab2} (${suggestions.length})`}
            </button>
          ))}
        </div>
        <div style={{ maxHeight: 'calc(90vh - 130px)', overflowY: 'auto', padding: 20 }}>
          {tab === 'submit' ? (
            submitted ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
                <p style={{ color: '#16a34a', fontWeight: 600 }}>{t.successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: `${t.titleLabel} *`, key: 'title', type: 'text', ph: t.titlePlaceholder },
                  { label: `${t.categoryLabel} *`, key: 'category', type: 'select' },
                  { label: `${t.descLabel} *`, key: 'description', type: 'textarea', ph: t.descPlaceholder },
                  { label: t.nameLabel, key: 'name', type: 'text' },
                  { label: t.emailLabel, key: 'email', type: 'email' },
                ].map((field) => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b6860', marginBottom: 4 }}>{field.label}</label>
                    {field.type === 'select' ? (
                      <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e8e2db', fontSize: 13, outline: 'none', background: 'white' }}>
                        <option value="">—</option>
                        {t.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea rows={3} required placeholder={field.ph} value={form[field.key as keyof typeof form] as string}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e8e2db', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                    ) : (
                      <input type={field.type} placeholder={field.ph} value={form[field.key as keyof typeof form] as string}
                        required={field.label.includes('*')}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e8e2db', fontSize: 13, outline: 'none' }} />
                    )}
                  </div>
                ))}
                <button type="submit" className="btn-coral" style={{ padding: '13px 0', fontSize: 14, borderRadius: 10, minHeight: 44 }}>{t.submit}</button>
              </form>
            )
          ) : (
            sorted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 13 }}>{t.noSuggestions}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sorted.map((s) => {
                  const voted = s.votedBy.includes(getDeviceId())
                  return (
                    <div key={s.id} style={{ padding: 14, background: '#fdf8f4', borderRadius: 12, border: '1px solid #ede8e2', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ background: `${CORAL}15`, color: CORAL, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>{s.category}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e', marginBottom: 2 }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: '#6b6860', lineHeight: 1.5 }}>{s.description}</div>
                        {s.name && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{s.name}</div>}
                      </div>
                      <button onClick={() => handleVote(s.id)} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                        padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${voted ? CORAL + '40' : '#e8e2db'}`,
                        background: voted ? `${CORAL}10` : 'white', color: voted ? CORAL : '#9ca3af',
                        cursor: voted ? 'default' : 'pointer', minWidth: 42,
                      }}>
                        <span style={{ fontSize: 12 }}>▲</span>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{s.votes}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Contact Modal ─────────────────────────────────────────────────────────────

function ContactModal({ locale, t, onClose }: { locale: Locale; t: ContactT; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', message: '', consent: false })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.consent) return
    setStatus('loading')
    try {
      const res = await fetch('/api/demo-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setStatus(res.ok ? 'success' : 'error')
    } catch { setStatus('error') }
  }

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ background: CORAL, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>{t.title}</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: 'none', cursor: 'pointer', fontSize: 16, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ padding: 20 }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
              <p style={{ color: '#16a34a', fontWeight: 600 }}>{t.successMsg}</p>
            </div>
          ) : (
            <>
              <p style={{ color: '#6b6860', fontSize: 13, marginBottom: 16 }}>{t.subtitle}</p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: `${t.nameLabel} *`, key: 'name', type: 'text' },
                  { label: `${t.emailLabel} *`, key: 'email', type: 'email' },
                  { label: t.messageLabel, key: 'message', type: 'textarea' },
                ].map((f) => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b6860', marginBottom: 4 }}>{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea rows={3} value={form[f.key as keyof typeof form] as string}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e8e2db', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                    ) : (
                      <input type={f.type} required={f.label.includes('*')} value={form[f.key as keyof typeof form] as string}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e8e2db', fontSize: 13, outline: 'none' }} />
                    )}
                  </div>
                ))}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" required checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} style={{ marginTop: 2, accentColor: CORAL }} />
                  <span style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{t.consentLabel}</span>
                </label>
                {status === 'error' && <p style={{ color: '#ef4444', fontSize: 12 }}>{t.errorMsg}</p>}
                <button type="submit" disabled={status === 'loading'} className="btn-coral" style={{ padding: '13px 0', fontSize: 14, borderRadius: 10, minHeight: 44, opacity: status === 'loading' ? .7 : 1 }}>
                  {status === 'loading' ? t.submitting : t.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
