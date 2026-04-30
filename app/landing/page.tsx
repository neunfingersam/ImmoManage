'use client'

import { useState, useEffect, useRef } from 'react'
import { translations, type Locale } from './translations'

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────────────────────

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'it', label: 'IT' },
  { code: 'en', label: 'EN' },
]

const DEVICE_ID =
  typeof window !== 'undefined'
    ? (() => {
        let id = localStorage.getItem('immo_device_id')
        if (!id) {
          id = Math.random().toString(36).slice(2)
          localStorage.setItem('immo_device_id', id)
        }
        return id
      })()
    : 'server'

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [locale, setLocale] = useState<Locale>('de')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('immo_locale') as Locale | null
    if (saved && ['de', 'fr', 'it', 'en'].includes(saved)) setLocale(saved)

    const onScroll = () => setScrolled(window.scrollY > 20)
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

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .gradient-text {
          background: linear-gradient(135deg, #FF7A59 0%, #6366F1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-gradient {
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
        }
        .card-glass {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.15);
        }
        .feature-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(99,102,241,0.15);
        }
        .pricing-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.12);
        }
        .float-btn {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .fade-in {
          animation: fadeIn 0.6s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up {
          animation: slideUp 0.5s ease forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stat-card {
          transition: transform 0.2s;
        }
        .stat-card:hover { transform: scale(1.04); }
        .nav-link {
          position: relative;
          transition: color 0.2s;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0;
          width: 0; height: 2px;
          background: linear-gradient(90deg, #FF7A59, #6366F1);
          transition: width 0.25s;
        }
        .nav-link:hover::after { width: 100%; }
        .modal-overlay {
          animation: fadeOverlay 0.2s ease forwards;
        }
        @keyframes fadeOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-content {
          animation: slideModal 0.3s ease forwards;
        }
        @keyframes slideModal {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tag-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          background: rgba(99,102,241,0.15);
          color: #6366F1;
        }
        .hero-mockup {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 20px;
        }
        .mockup-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          margin-bottom: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .mockup-dot { width: 8px; height: 8px; border-radius: 50%; }
        .pulse-dot {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #6366F1; border-radius: 3px; }
      `}</style>

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.08)' : 'none',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo('hero')}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #FF7A59, #6366F1)' }}
            >
              I
            </div>
            <span
              className="text-lg font-bold"
              style={{
                color: scrolled ? '#1A1A2E' : 'white',
                fontFamily: "'DM Serif Display', serif",
              }}
            >
              ImmoManage
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { label: t.nav.features, id: 'features' },
              { label: t.nav.pricing, id: 'pricing' },
              { label: t.nav.testimonials, id: 'testimonials' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="nav-link text-sm font-medium"
                style={{ color: scrolled ? '#374151' : 'rgba(255,255,255,0.85)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
              >
                {item.label}
              </button>
            ))}

            {/* Language Switcher */}
            <div className="flex items-center gap-1 ml-2">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => changeLocale(l.code)}
                  className="text-xs font-semibold px-2 py-1 rounded transition-all"
                  style={{
                    background: locale === l.code ? 'linear-gradient(135deg, #FF7A59, #6366F1)' : 'transparent',
                    color: locale === l.code ? 'white' : scrolled ? '#6b7280' : 'rgba(255,255,255,0.6)',
                    border: locale === l.code ? 'none' : `1px solid ${scrolled ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setContactOpen(true)}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FF7A59, #6366F1)' }}
            >
              {t.nav.demo}
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block w-5 h-0.5 rounded transition-all"
                style={{ background: scrolled ? '#1A1A2E' : 'white' }}
              />
            ))}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg fade-in">
            <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3">
              {[
                { label: t.nav.features, id: 'features' },
                { label: t.nav.pricing, id: 'pricing' },
                { label: t.nav.testimonials, id: 'testimonials' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="text-left text-sm font-medium text-gray-700 py-2"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {item.label}
                </button>
              ))}
              <div className="flex items-center gap-2 py-2">
                {LOCALES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => changeLocale(l.code)}
                    className="text-xs font-semibold px-3 py-1.5 rounded"
                    style={{
                      background: locale === l.code ? 'linear-gradient(135deg, #FF7A59, #6366F1)' : '#f3f4f6',
                      color: locale === l.code ? 'white' : '#6b7280',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setContactOpen(true); setMobileMenuOpen(false) }}
                className="w-full text-sm font-semibold py-3 rounded-lg text-white"
                style={{ background: 'linear-gradient(135deg, #FF7A59, #6366F1)', border: 'none', cursor: 'pointer' }}
              >
                {t.nav.demo}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section
        id="hero"
        className="hero-gradient min-h-screen flex items-center pt-16"
        style={{ minHeight: '100vh' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="fade-in">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{ background: 'rgba(255,122,89,0.2)', color: '#FF7A59', border: '1px solid rgba(255,122,89,0.3)' }}
              >
                <span className="pulse-dot w-2 h-2 rounded-full inline-block" style={{ background: '#FF7A59' }} />
                {t.hero.badge}
              </div>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-white"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {t.hero.title}
                <br />
                <span className="gradient-text">{t.hero.titleHighlight}</span>
              </h1>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-lg">
                {t.hero.subtitle}
              </p>
              <div className="flex flex-wrap gap-3 mb-12">
                <button
                  onClick={() => setContactOpen(true)}
                  className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #FF7A59, #6366F1)',
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  {t.hero.cta1}
                </button>
                <button
                  onClick={() => scrollTo('features')}
                  className="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white hover:bg-opacity-10"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  {t.hero.cta2}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { val: t.hero.stat1, sub: t.hero.stat1sub },
                  { val: t.hero.stat2, sub: t.hero.stat2sub },
                  { val: t.hero.stat3, sub: t.hero.stat3sub },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="stat-card card-glass rounded-xl p-3 text-center"
                    style={{ cursor: 'default' }}
                  >
                    <div className="font-bold text-white text-lg">{s.val}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — App Mockup */}
            <div className="hidden md:block hero-mockup slide-up">
              <div className="flex items-center gap-2 mb-4">
                {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                ))}
                <div
                  className="flex-1 h-4 rounded ml-2"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              <div className="mockup-row">
                <div className="mockup-dot pulse-dot" style={{ background: '#FF7A59' }} />
                <div style={{ flex: 1 }}>
                  <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.3)', width: '60%' }} />
                </div>
                <div
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}
                >
                  AKTIV
                </div>
              </div>
              <div className="mockup-row">
                <div className="mockup-dot" style={{ background: '#6366F1' }} />
                <div style={{ flex: 1 }}>
                  <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.2)', width: '45%' }} />
                </div>
                <div
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}
                >
                  OFFEN
                </div>
              </div>
              <div className="mockup-row">
                <div className="mockup-dot" style={{ background: '#4ade80' }} />
                <div style={{ flex: 1 }}>
                  <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.25)', width: '70%' }} />
                </div>
                <div
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}
                >
                  AKTIV
                </div>
              </div>
              <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm">🤖</div>
                  <div className="text-xs font-semibold text-indigo-300">KI-Assistent</div>
                </div>
                <div className="text-xs text-gray-300 leading-relaxed">
                  "Ihre Nebenkosten für 2024 betragen CHF 1'840. Die Abrechnung wurde am 15.01.2025 versendet..."
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { label: 'Wohnungen', val: '12', color: '#FF7A59' },
                  { label: 'Mieter', val: '18', color: '#6366F1' },
                  { label: 'Tickets', val: '3', color: '#fbbf24' },
                  { label: 'Dokumente', val: '47', color: '#4ade80' },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="text-xl font-bold" style={{ color: item.color }}>{item.val}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ height: 60, zIndex: 1 }}>
          <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,60 C300,0 900,60 1200,0 L1200,60 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ fontFamily: "'DM Serif Display', serif", color: '#1A1A2E' }}
            >
              {t.features.title}
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">{t.features.subtitle}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {t.features.items.map((item, i) => (
              <div
                key={i}
                className="feature-card rounded-2xl p-5 cursor-default"
                style={{
                  background: 'linear-gradient(135deg, #fafafa 0%, #f5f3ff 100%)',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(255,122,89,0.12), rgba(99,102,241,0.12))' }}
                >
                  {item.icon}
                </div>
                <h3 className="font-semibold text-base mb-1.5" style={{ color: '#1A1A2E' }}>
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="py-24"
        style={{ background: 'linear-gradient(135deg, #fafafa 0%, #f0f0ff 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ fontFamily: "'DM Serif Display', serif", color: '#1A1A2E' }}
            >
              {t.pricing.title}
            </h2>
            <p className="text-gray-500 text-lg">{t.pricing.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {t.pricing.plans.map((plan, i) => (
              <div
                key={i}
                className="pricing-card rounded-2xl p-6 flex flex-col relative"
                style={
                  plan.highlight
                    ? {
                        background: 'linear-gradient(135deg, #FF7A59 0%, #6366F1 100%)',
                        border: '2px solid transparent',
                        color: 'white',
                      }
                    : {
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        color: '#1A1A2E',
                      }
                }
              >
                {plan.highlight && (
                  <div
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: '#1A1A2E', color: 'white' }}
                  >
                    {t.pricing.popular}
                  </div>
                )}
                <div>
                  <div className="font-bold text-lg mb-1">{plan.name}</div>
                  <div
                    className="text-3xl font-bold mb-1"
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    {plan.price}
                    {plan.price !== 'Auf Anfrage' && plan.price !== 'Sur demande' && plan.price !== 'Su richiesta' && plan.price !== 'On request' && (
                      <span className="text-base font-normal opacity-70">{t.pricing.month}</span>
                    )}
                  </div>
                  <p className="text-sm opacity-70 mb-5">{plan.desc}</p>
                </div>
                <ul className="flex-1 space-y-2.5 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <span style={{ color: plan.highlight ? 'rgba(255,255,255,0.9)' : '#6366F1' }}>✓</span>
                      <span style={{ opacity: 0.9 }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setContactOpen(true)}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                  style={
                    plan.highlight
                      ? { background: 'white', color: '#6366F1', border: 'none', cursor: 'pointer', minHeight: '44px' }
                      : {
                          background: 'linear-gradient(135deg, #FF7A59, #6366F1)',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          minHeight: '44px',
                        }
                  }
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <section
        id="testimonials"
        className="py-24"
        style={{ background: '#1A1A2E' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4 text-white"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {t.testimonials.title}
            </h2>
            <p className="text-gray-400 text-lg">{t.testimonials.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {t.testimonials.items.map((item, i) => (
              <div
                key={i}
                className="card-glass rounded-2xl p-6 feature-card"
                style={{ cursor: 'default' }}
              >
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} style={{ color: '#FF7A59', fontSize: 14 }}>★</span>
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5 italic">"{item.text}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: `linear-gradient(135deg, #FF7A59, #6366F1)` }}
                  >
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{item.name}</div>
                    <div className="text-gray-400 text-xs">
                      {item.role} · {item.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer
        className="py-12"
        style={{ background: '#0d0d1a', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #FF7A59, #6366F1)' }}
                >
                  I
                </div>
                <span
                  className="text-white font-bold"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  ImmoManage
                </span>
              </div>
              <p className="text-gray-500 text-xs max-w-xs">{t.footer.tagline}</p>
            </div>
            <div className="flex items-center gap-5">
              {t.footer.links.map((link, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-gray-500 text-xs hover:text-gray-300 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 text-center text-gray-600 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {t.footer.copyright}
          </div>
        </div>
      </footer>

      {/* ── Floating Feedback Button ─────────────────────────── */}
      <button
        onClick={() => setFeedbackOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 20px',
          borderRadius: 999,
          fontWeight: 600,
          fontSize: 14,
          color: 'white',
          background: 'linear-gradient(135deg, #6366F1, #FF7A59)',
          border: 'none',
          cursor: 'pointer',
          minHeight: 44,
          boxShadow: '0 8px 30px rgba(99,102,241,0.4)',
          animation: 'float 3s ease-in-out infinite',
        }}
      >
        <span style={{ fontSize: 18 }}>💡</span>
        <span>{t.feedback.buttonTitle}</span>
      </button>

      {/* ── Feedback Modal ──────────────────────────────────── */}
      {feedbackOpen && (
        <FeedbackModal locale={locale} t={t.feedback} onClose={() => setFeedbackOpen(false)} />
      )}

      {/* ── Contact/Demo Modal ──────────────────────────────── */}
      {contactOpen && (
        <ContactModal locale={locale} t={t.contact} onClose={() => setContactOpen(false)} />
      )}
    </div>
  )
}

// ─── Feedback Modal ──────────────────────────────────────────────────────────

interface FeedbackT {
  buttonTitle: string
  modalTitle: string
  tab1: string
  tab2: string
  titleLabel: string
  titlePlaceholder: string
  categoryLabel: string
  descLabel: string
  descPlaceholder: string
  nameLabel: string
  emailLabel: string
  submit: string
  submitting: string
  successMsg: string
  noSuggestions: string
  vote: string
  categories: readonly string[]
}

interface ContactT {
  title: string
  subtitle: string
  nameLabel: string
  emailLabel: string
  messageLabel: string
  consentLabel: string
  submit: string
  submitting: string
  successMsg: string
  errorMsg: string
}

function FeedbackModal({
  locale,
  t,
  onClose,
}: {
  locale: Locale
  t: FeedbackT
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<'submit' | 'all'>('submit')
  const [form, setForm] = useState({ title: '', category: '', description: '', name: '', email: '' })
  const [submitted, setSubmitted] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('immo_suggestions')
    if (saved) setSuggestions(JSON.parse(saved))
  }, [])

  const saveSuggestions = (items: Suggestion[]) => {
    setSuggestions(items)
    localStorage.setItem('immo_suggestions', JSON.stringify(items))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.category || !form.description) return
    const newItem: Suggestion = {
      id: Date.now().toString(),
      ...form,
      votes: 0,
      votedBy: [],
      createdAt: new Date().toISOString(),
    }
    saveSuggestions([newItem, ...suggestions])
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setForm({ title: '', category: '', description: '', name: '', email: '' })
      setActiveTab('all')
    }, 1800)
  }

  const handleVote = (id: string) => {
    const deviceId = DEVICE_ID
    const updated = suggestions.map((s) => {
      if (s.id !== id) return s
      if (s.votedBy.includes(deviceId)) return s
      return { ...s, votes: s.votes + 1, votedBy: [...s.votedBy, deviceId] }
    })
    saveSuggestions(updated)
  }

  const sorted = [...suggestions].sort((a, b) => b.votes - a.votes)

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-content w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '85vh' }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ background: 'linear-gradient(135deg, #FF7A59 0%, #6366F1 100%)' }}
        >
          <span className="font-semibold text-white">{t.modalTitle}</span>
          <button
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(['submit', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 text-sm font-medium transition-colors"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: activeTab === tab ? '#6366F1' : '#6b7280',
                borderBottom: activeTab === tab ? '2px solid #6366F1' : '2px solid transparent',
              }}
            >
              {tab === 'submit' ? t.tab1 : `${t.tab2} (${suggestions.length})`}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {/* Submit Tab */}
          {activeTab === 'submit' && (
            <div className="p-4">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="text-green-600 font-medium">{t.successMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.titleLabel} *</label>
                    <input
                      type="text"
                      placeholder={t.titlePlaceholder}
                      required
                      className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      style={{ border: '1px solid #e5e7eb' }}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.categoryLabel} *</label>
                    <select
                      required
                      className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      style={{ border: '1px solid #e5e7eb' }}
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="">—</option>
                      {t.categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.descLabel} *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder={t.descPlaceholder}
                      className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                      style={{ border: '1px solid #e5e7eb' }}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t.nameLabel}</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        style={{ border: '1px solid #e5e7eb' }}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t.emailLabel}</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        style={{ border: '1px solid #e5e7eb' }}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #FF7A59, #6366F1)', border: 'none', cursor: 'pointer', minHeight: '44px' }}
                  >
                    {t.submit}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* All Suggestions Tab */}
          {activeTab === 'all' && (
            <div className="p-4">
              {sorted.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">{t.noSuggestions}</div>
              ) : (
                <div className="space-y-3">
                  {sorted.map((s) => {
                    const alreadyVoted = s.votedBy.includes(DEVICE_ID)
                    return (
                      <div key={s.id} className="rounded-xl p-3.5" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="tag-badge">{s.category}</span>
                            </div>
                            <div className="font-medium text-sm text-gray-800 mb-0.5">{s.title}</div>
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{s.description}</p>
                            {s.name && <div className="text-xs text-gray-400 mt-1">{s.name}</div>}
                          </div>
                          <button
                            onClick={() => handleVote(s.id)}
                            className="flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg transition-all"
                            style={{
                              background: alreadyVoted ? 'rgba(99,102,241,0.1)' : '#f3f4f6',
                              border: `1px solid ${alreadyVoted ? 'rgba(99,102,241,0.3)' : '#e5e7eb'}`,
                              cursor: alreadyVoted ? 'default' : 'pointer',
                              color: alreadyVoted ? '#6366F1' : '#6b7280',
                              minWidth: 44,
                            }}
                          >
                            <span style={{ fontSize: 14 }}>▲</span>
                            <span className="text-xs font-bold">{s.votes}</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Contact/Demo Modal ──────────────────────────────────────────────────────

function ContactModal({
  locale,
  t,
  onClose,
}: {
  locale: Locale
  t: ContactT
  onClose: () => void
}) {
  const [form, setForm] = useState({ name: '', email: '', message: '', consent: false })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.consent) return
    setStatus('loading')
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ background: 'linear-gradient(135deg, #FF7A59 0%, #6366F1 100%)' }}
        >
          <span className="font-semibold text-white">{t.title}</span>
          <button
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>

        <div className="p-5">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-green-600 font-medium">{t.successMsg}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{t.subtitle}</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t.nameLabel} *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    style={{ border: '1px solid #e5e7eb' }}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t.emailLabel} *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    style={{ border: '1px solid #e5e7eb' }}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t.messageLabel}</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                    style={{ border: '1px solid #e5e7eb' }}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 accent-indigo-500"
                    checked={form.consent}
                    onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">{t.consentLabel}</span>
                </label>
                {status === 'error' && (
                  <p className="text-red-500 text-xs">{t.errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #FF7A59, #6366F1)', border: 'none', cursor: 'pointer', minHeight: '44px' }}
                >
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
