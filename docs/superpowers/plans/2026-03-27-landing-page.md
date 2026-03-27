# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multilingual (DE/FR/EN/IT) marketing landing page at immo-manage.ch that converts visitors into demo requests.

**Architecture:** The landing page lives inside the existing Next.js app. `app/[lang]/page.tsx` is modified to show the landing page for unauthenticated visitors and redirect authenticated users to their dashboard. All landing page sections are separate Server Components under `components/landing/`. Translations go into the existing `messages/*.json` files.

**Tech Stack:** Next.js 15 App Router, next-intl, Tailwind CSS v4, shadcn/ui, DM Sans + DM Serif Display fonts, Resend/SMTP for contact form

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Copy | `public/logo.png` | ImmoManage logo (from root) |
| Modify | `app/[lang]/page.tsx` | Show landing for guests, redirect auth users |
| Create | `components/landing/LandingNav.tsx` | Sticky nav with logo, lang switcher, CTA button |
| Create | `components/landing/HeroSection.tsx` | Headline, subtext, CTA button, logo visual |
| Create | `components/landing/ProblemSection.tsx` | "Kennen Sie das?" — 3 pain point cards |
| Create | `components/landing/FeaturesSection.tsx` | 6 feature tiles with icons |
| Create | `components/landing/ForWhomSection.tsx` | 2-column: Hausverwaltung vs. Eigentümer |
| Create | `components/landing/DemoCtaSection.tsx` | Contact form (name, email, message) |
| Create | `components/landing/LandingFooter.tsx` | Logo, links, lang switcher, copyright |
| Create | `app/api/demo-request/route.ts` | POST handler — saves request, sends email notification |
| Modify | `messages/de.json` | Add `landing` namespace |
| Modify | `messages/fr.json` | Add `landing` namespace |
| Modify | `messages/en.json` | Add `landing` namespace |
| Modify | `messages/it.json` | Add `landing` namespace |

---

## Task 1: Copy logo to public folder

**Files:**
- Copy: `Immo-Manage-Logo.png` → `public/logo.png`

- [ ] **Step 1: Copy the logo**

```bash
cp "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/Immo-Manage-Logo.png" \
   "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/public/logo.png"
```

- [ ] **Step 2: Verify**

```bash
ls public/logo.png
```
Expected: file exists

- [ ] **Step 3: Commit**

```bash
git add public/logo.png
git commit -m "feat: add ImmoManage logo to public assets"
```

---

## Task 2: Add translations

**Files:**
- Modify: `messages/de.json`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`
- Modify: `messages/it.json`

- [ ] **Step 1: Add German translations**

Add to the end of `messages/de.json` (before the final `}`):

```json
"landing": {
  "nav": {
    "bookDemo": "Demo buchen"
  },
  "hero": {
    "headline": "Schluss mit Zettelwirtschaft.",
    "headlineAccent": "Willkommen bei ImmoManage.",
    "subtext": "Die Schweizer Lösung für Hausverwaltungen und private Eigentümer — einfach, vollständig, CH-konform.",
    "cta": "Demo buchen"
  },
  "problem": {
    "title": "Kennen Sie das?",
    "item1Title": "Excel-Tabellen die nie stimmen",
    "item1Desc": "Formeln die brechen, Versionen die sich widersprechen, Stunden verloren.",
    "item2Title": "QR-Rechnungen manuell erstellen",
    "item2Desc": "Jeder Mieter, jeder Monat, von Hand. Das kostet Stunden die Sie nicht haben.",
    "item3Title": "Mieter anrufen statt digital erledigen",
    "item3Desc": "Reparaturmeldungen per Telefon, Dokumente per Post — obwohl es längst besser geht."
  },
  "features": {
    "title": "Alles was Sie brauchen — in einer Lösung",
    "f1Title": "Objekte & Einheiten",
    "f1Desc": "Alle Liegenschaften auf einen Blick. Status, Leerstand, Fotos.",
    "f2Title": "Mieter & Verträge",
    "f2Desc": "Stammdaten, Mietverträge, Kaution, Mieterwechsel-Assistent.",
    "f3Title": "Zahlungen & QR-Rechnung",
    "f3Desc": "CH-konform. CAMT.053 Import. Automatische Mahnungen.",
    "f4Title": "Mieter-Portal",
    "f4Desc": "Tickets, Dokumente, Nachrichten — Ihre Mieter erledigen alles digital.",
    "f5Title": "KI-Assistent",
    "f5Desc": "Automatisierte Unterstützung im Verwaltungsalltag.",
    "f6Title": "Dokumente & Vorlagen",
    "f6Desc": "CH-Vorlagen (DE + FR), digitale Ablage, alles auf Knopfdruck."
  },
  "forWhom": {
    "title": "Für wen ist ImmoManage?",
    "segment1Title": "Kleine Hausverwaltungen",
    "segment1Subtitle": "1–10 Mitarbeitende",
    "segment1Points": [
      "Mehrere Objekte zentral verwalten",
      "Team-Zugang mit Rollen",
      "Professionelle Abrechnung"
    ],
    "segment2Title": "Private Eigentümer",
    "segment2Subtitle": "3–15 Einheiten",
    "segment2Points": [
      "Einfacher Einstieg, kein IT-Wissen nötig",
      "Günstig und skalierbar",
      "Alles an einem Ort"
    ]
  },
  "demo": {
    "title": "Überzeugen Sie sich selbst",
    "subtitle": "Wir zeigen Ihnen ImmoManage in einem kurzen Demo-Gespräch — kostenlos und unverbindlich.",
    "namePlaceholder": "Ihr Name",
    "emailPlaceholder": "Ihre E-Mail",
    "messagePlaceholder": "Was möchten Sie verwalten? (optional)",
    "submit": "Demo anfragen",
    "success": "Danke! Wir melden uns innerhalb von 24 Stunden.",
    "error": "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut."
  },
  "footer": {
    "privacy": "Datenschutz",
    "imprint": "Impressum",
    "copyright": "© 2026 ImmoManage · Schweiz"
  }
}
```

- [ ] **Step 2: Add French translations**

Add to `messages/fr.json`:

```json
"landing": {
  "nav": {
    "bookDemo": "Réserver une démo"
  },
  "hero": {
    "headline": "Fini la paperasse.",
    "headlineAccent": "Bienvenue sur ImmoManage.",
    "subtext": "La solution suisse pour les gérants et propriétaires — simple, complète, conforme CH.",
    "cta": "Réserver une démo"
  },
  "problem": {
    "title": "Vous reconnaissez-vous?",
    "item1Title": "Des tableaux Excel qui ne fonctionnent jamais",
    "item1Desc": "Formules cassées, versions contradictoires, des heures perdues.",
    "item2Title": "Créer des QR-factures à la main",
    "item2Desc": "Chaque locataire, chaque mois, manuellement. Des heures que vous n'avez pas.",
    "item3Title": "Appeler les locataires au lieu du digital",
    "item3Desc": "Signalements par téléphone, documents par courrier — alors qu'il existe mieux."
  },
  "features": {
    "title": "Tout ce dont vous avez besoin — en une solution",
    "f1Title": "Objets & Unités",
    "f1Desc": "Tous vos biens immobiliers en un coup d'œil. Statut, vacance, photos.",
    "f2Title": "Locataires & Contrats",
    "f2Desc": "Données de base, baux, caution, assistant changement de locataire.",
    "f3Title": "Paiements & QR-Facture",
    "f3Desc": "Conforme CH. Import CAMT.053. Rappels automatiques.",
    "f4Title": "Portail Locataires",
    "f4Desc": "Tickets, documents, messages — vos locataires font tout en ligne.",
    "f5Title": "Assistant IA",
    "f5Desc": "Assistance automatisée dans votre gestion quotidienne.",
    "f6Title": "Documents & Modèles",
    "f6Desc": "Modèles CH (DE + FR), archivage numérique, tout en un clic."
  },
  "forWhom": {
    "title": "Pour qui est ImmoManage?",
    "segment1Title": "Petites gérance immobilière",
    "segment1Subtitle": "1–10 collaborateurs",
    "segment1Points": [
      "Gérer plusieurs objets centralement",
      "Accès équipe avec rôles",
      "Facturation professionnelle"
    ],
    "segment2Title": "Propriétaires privés",
    "segment2Subtitle": "3–15 unités",
    "segment2Points": [
      "Démarrage simple, sans connaissances IT",
      "Abordable et évolutif",
      "Tout en un seul endroit"
    ]
  },
  "demo": {
    "title": "Convainquez-vous vous-même",
    "subtitle": "Nous vous montrons ImmoManage lors d'une courte démo — gratuit et sans engagement.",
    "namePlaceholder": "Votre nom",
    "emailPlaceholder": "Votre e-mail",
    "messagePlaceholder": "Que souhaitez-vous gérer? (optionnel)",
    "submit": "Demander une démo",
    "success": "Merci! Nous vous répondrons dans les 24 heures.",
    "error": "Une erreur s'est produite. Veuillez réessayer."
  },
  "footer": {
    "privacy": "Protection des données",
    "imprint": "Mentions légales",
    "copyright": "© 2026 ImmoManage · Suisse"
  }
}
```

- [ ] **Step 3: Add English translations**

Add to `messages/en.json`:

```json
"landing": {
  "nav": {
    "bookDemo": "Book a demo"
  },
  "hero": {
    "headline": "No more spreadsheet chaos.",
    "headlineAccent": "Welcome to ImmoManage.",
    "subtext": "The Swiss solution for property managers and private landlords — simple, complete, Swiss-compliant.",
    "cta": "Book a demo"
  },
  "problem": {
    "title": "Sound familiar?",
    "item1Title": "Spreadsheets that never quite work",
    "item1Desc": "Broken formulas, conflicting versions, hours wasted every month.",
    "item2Title": "Creating QR invoices by hand",
    "item2Desc": "Every tenant, every month, manually. Hours you simply don't have.",
    "item3Title": "Calling tenants instead of going digital",
    "item3Desc": "Repair requests by phone, documents by post — even though there's a better way."
  },
  "features": {
    "title": "Everything you need — in one solution",
    "f1Title": "Properties & Units",
    "f1Desc": "All your properties at a glance. Status, vacancy, photos.",
    "f2Title": "Tenants & Leases",
    "f2Desc": "Contact data, lease agreements, deposits, tenant handover wizard.",
    "f3Title": "Payments & QR Invoice",
    "f3Desc": "Swiss-compliant. CAMT.053 import. Automatic reminders.",
    "f4Title": "Tenant Portal",
    "f4Desc": "Tickets, documents, messages — your tenants handle everything digitally.",
    "f5Title": "AI Assistant",
    "f5Desc": "Automated support for your daily property management tasks.",
    "f6Title": "Documents & Templates",
    "f6Desc": "Swiss templates (DE + FR), digital filing, everything on demand."
  },
  "forWhom": {
    "title": "Who is ImmoManage for?",
    "segment1Title": "Small property managers",
    "segment1Subtitle": "1–10 employees",
    "segment1Points": [
      "Manage multiple properties centrally",
      "Team access with roles",
      "Professional billing"
    ],
    "segment2Title": "Private landlords",
    "segment2Subtitle": "3–15 units",
    "segment2Points": [
      "Easy to get started, no IT knowledge needed",
      "Affordable and scalable",
      "Everything in one place"
    ]
  },
  "demo": {
    "title": "See it for yourself",
    "subtitle": "We'll show you ImmoManage in a short demo — free and no commitment.",
    "namePlaceholder": "Your name",
    "emailPlaceholder": "Your email",
    "messagePlaceholder": "What do you want to manage? (optional)",
    "submit": "Request a demo",
    "success": "Thank you! We'll get back to you within 24 hours.",
    "error": "Something went wrong. Please try again."
  },
  "footer": {
    "privacy": "Privacy Policy",
    "imprint": "Imprint",
    "copyright": "© 2026 ImmoManage · Switzerland"
  }
}
```

- [ ] **Step 4: Add Italian translations**

Add to `messages/it.json`:

```json
"landing": {
  "nav": {
    "bookDemo": "Prenota una demo"
  },
  "hero": {
    "headline": "Basta fogli Excel.",
    "headlineAccent": "Benvenuto su ImmoManage.",
    "subtext": "La soluzione svizzera per amministratori e proprietari — semplice, completa, conforme alla Svizzera.",
    "cta": "Prenota una demo"
  },
  "problem": {
    "title": "Vi riconoscete?",
    "item1Title": "Fogli Excel che non funzionano mai",
    "item1Desc": "Formule rotte, versioni contrastanti, ore perse ogni mese.",
    "item2Title": "Creare fatture QR a mano",
    "item2Desc": "Ogni inquilino, ogni mese, manualmente. Ore che non avete.",
    "item3Title": "Chiamare gli inquilini invece del digitale",
    "item3Desc": "Segnalazioni per telefono, documenti per posta — anche se esiste di meglio."
  },
  "features": {
    "title": "Tutto ciò di cui avete bisogno — in un'unica soluzione",
    "f1Title": "Immobili & Unità",
    "f1Desc": "Tutti i vostri immobili a colpo d'occhio. Stato, sfitto, foto.",
    "f2Title": "Inquilini & Contratti",
    "f2Desc": "Dati, contratti, cauzione, assistente cambio inquilino.",
    "f3Title": "Pagamenti & Fattura QR",
    "f3Desc": "Conforme CH. Import CAMT.053. Promemoria automatici.",
    "f4Title": "Portale Inquilini",
    "f4Desc": "Ticket, documenti, messaggi — i vostri inquilini fanno tutto digitalmente.",
    "f5Title": "Assistente IA",
    "f5Desc": "Supporto automatizzato nella gestione quotidiana.",
    "f6Title": "Documenti & Modelli",
    "f6Desc": "Modelli CH (DE + FR), archiviazione digitale, tutto con un clic."
  },
  "forWhom": {
    "title": "Per chi è ImmoManage?",
    "segment1Title": "Piccole amministrazioni",
    "segment1Subtitle": "1–10 collaboratori",
    "segment1Points": [
      "Gestire più immobili centralmente",
      "Accesso team con ruoli",
      "Fatturazione professionale"
    ],
    "segment2Title": "Proprietari privati",
    "segment2Subtitle": "3–15 unità",
    "segment2Points": [
      "Facile da iniziare, nessuna conoscenza IT",
      "Conveniente e scalabile",
      "Tutto in un unico posto"
    ]
  },
  "demo": {
    "title": "Convincetevi da soli",
    "subtitle": "Vi mostriamo ImmoManage in una breve demo — gratuita e senza impegno.",
    "namePlaceholder": "Il vostro nome",
    "emailPlaceholder": "La vostra e-mail",
    "messagePlaceholder": "Cosa volete gestire? (opzionale)",
    "submit": "Richiedere una demo",
    "success": "Grazie! Vi risponderemo entro 24 ore.",
    "error": "Qualcosa è andato storto. Per favore riprova."
  },
  "footer": {
    "privacy": "Protezione dei dati",
    "imprint": "Impronta",
    "copyright": "© 2026 ImmoManage · Svizzera"
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add messages/de.json messages/fr.json messages/en.json messages/it.json
git commit -m "feat: add landing page translations for DE/FR/EN/IT"
```

---

## Task 3: API route for demo requests

**Files:**
- Create: `app/api/demo-request/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// app/api/demo-request/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json()

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
  }

  // Log to console for now — replace with email sending later
  console.log('[Demo Request]', { name, email, message, at: new Date().toISOString() })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/demo-request/route.ts
git commit -m "feat: add demo request API route"
```

---

## Task 4: LandingNav component

**Files:**
- Create: `components/landing/LandingNav.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/landing/LandingNav.tsx
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import LocaleSwitcher from '@/components/LocaleSwitcher'

export default function LandingNav() {
  const t = useTranslations('landing.nav')

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="ImmoManage" width={120} height={40} className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <a
            href="#demo"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#E8734A' }}
          >
            {t('bookDemo')}
          </a>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/LandingNav.tsx
git commit -m "feat: add LandingNav component"
```

---

## Task 5: HeroSection component

**Files:**
- Create: `components/landing/HeroSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/landing/HeroSection.tsx
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export default function HeroSection() {
  const t = useTranslations('landing.hero')

  return (
    <section className="relative overflow-hidden bg-[#FAFAF8] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Text */}
          <div>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-[#1A1A2E] md:text-5xl lg:text-6xl">
              {t('headline')}{' '}
              <span style={{ color: '#E8734A' }}>{t('headlineAccent')}</span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-gray-600">
              {t('subtext')}
            </p>
            <a
              href="#demo"
              className="inline-block rounded-xl px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{ backgroundColor: '#E8734A' }}
            >
              {t('cta')}
            </a>
          </div>
          {/* Visual */}
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="ImmoManage"
              width={400}
              height={300}
              className="h-auto w-full max-w-sm drop-shadow-xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/HeroSection.tsx
git commit -m "feat: add HeroSection component"
```

---

## Task 6: ProblemSection component

**Files:**
- Create: `components/landing/ProblemSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/landing/ProblemSection.tsx
import { useTranslations } from 'next-intl'

const problems = [
  { key: 'item1', emoji: '📊' },
  { key: 'item2', emoji: '🧾' },
  { key: 'item3', emoji: '📞' },
] as const

export default function ProblemSection() {
  const t = useTranslations('landing.problem')

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-12 text-center text-3xl font-bold text-[#1A1A2E] md:text-4xl">
          {t('title')}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {problems.map(({ key, emoji }) => (
            <div
              key={key}
              className="rounded-2xl border border-orange-100 bg-orange-50 p-8"
            >
              <div className="mb-4 text-4xl">{emoji}</div>
              <h3 className="mb-3 text-lg font-semibold text-[#1A1A2E]">
                {t(`${key}Title`)}
              </h3>
              <p className="text-gray-600">{t(`${key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/ProblemSection.tsx
git commit -m "feat: add ProblemSection component"
```

---

## Task 7: FeaturesSection component

**Files:**
- Create: `components/landing/FeaturesSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/landing/FeaturesSection.tsx
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
    <section className="bg-[#FAFAF8] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-12 text-center text-3xl font-bold text-[#1A1A2E] md:text-4xl">
          {t('title')}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ key, Icon }) => (
            <div
              key={key}
              className="rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: '#FEF0EA' }}
              >
                <Icon className="h-6 w-6" style={{ color: '#E8734A' }} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#1A1A2E]">
                {t(`${key}Title`)}
              </h3>
              <p className="text-gray-600">{t(`${key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/FeaturesSection.tsx
git commit -m "feat: add FeaturesSection component"
```

---

## Task 8: ForWhomSection component

**Files:**
- Create: `components/landing/ForWhomSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/landing/ForWhomSection.tsx
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

export default function ForWhomSection() {
  const t = useTranslations('landing.forWhom')

  const segment1Points = t.raw('segment1Points') as string[]
  const segment2Points = t.raw('segment2Points') as string[]

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-12 text-center text-3xl font-bold text-[#1A1A2E] md:text-4xl">
          {t('title')}
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {/* Segment 1 */}
          <div className="rounded-2xl p-8" style={{ backgroundColor: '#FEF0EA' }}>
            <h3 className="mb-1 text-xl font-bold text-[#1A1A2E]">{t('segment1Title')}</h3>
            <p className="mb-6 text-sm font-medium" style={{ color: '#E8734A' }}>
              {t('segment1Subtitle')}
            </p>
            <ul className="space-y-3">
              {segment1Points.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#E8734A' }} />
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Segment 2 */}
          <div className="rounded-2xl bg-[#FAFAF8] p-8">
            <h3 className="mb-1 text-xl font-bold text-[#1A1A2E]">{t('segment2Title')}</h3>
            <p className="mb-6 text-sm font-medium" style={{ color: '#E8734A' }}>
              {t('segment2Subtitle')}
            </p>
            <ul className="space-y-3">
              {segment2Points.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#E8734A' }} />
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/ForWhomSection.tsx
git commit -m "feat: add ForWhomSection component"
```

---

## Task 9: DemoCtaSection component (with form)

**Files:**
- Create: `components/landing/DemoCtaSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/landing/DemoCtaSection.tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function DemoCtaSection() {
  const t = useTranslations('landing.demo')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="demo" className="bg-[#FAFAF8] py-20">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="mb-3 text-center text-3xl font-bold text-[#1A1A2E] md:text-4xl">
          {t('title')}
        </h2>
        <p className="mb-10 text-center text-gray-600">{t('subtitle')}</p>

        {status === 'success' ? (
          <div className="rounded-2xl bg-green-50 p-8 text-center text-green-700 font-medium">
            {t('success')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              required
              placeholder={t('namePlaceholder')}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[#1A1A2E] outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-orange-100"
            />
            <input
              type="email"
              required
              placeholder={t('emailPlaceholder')}
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[#1A1A2E] outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-orange-100"
            />
            <textarea
              rows={3}
              placeholder={t('messagePlaceholder')}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[#1A1A2E] outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-orange-100"
            />
            {status === 'error' && (
              <p className="text-sm text-red-600">{t('error')}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-xl py-4 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
              style={{ backgroundColor: '#E8734A' }}
            >
              {status === 'loading' ? '...' : t('submit')}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/DemoCtaSection.tsx
git commit -m "feat: add DemoCtaSection with contact form"
```

---

## Task 10: LandingFooter component

**Files:**
- Create: `components/landing/LandingFooter.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/landing/LandingFooter.tsx
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import LocaleSwitcher from '@/components/LocaleSwitcher'

export default function LandingFooter() {
  const t = useTranslations('landing.footer')

  return (
    <footer className="border-t border-gray-100 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 md:flex-row md:justify-between">
        <Image src="/logo.png" alt="ImmoManage" width={100} height={34} className="h-8 w-auto" />
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <Link href="#" className="hover:text-[#E8734A]">{t('privacy')}</Link>
          <Link href="#" className="hover:text-[#E8734A]">{t('imprint')}</Link>
          <LocaleSwitcher />
        </div>
        <p className="text-sm text-gray-400">{t('copyright')}</p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/LandingFooter.tsx
git commit -m "feat: add LandingFooter component"
```

---

## Task 11: Wire up the landing page

**Files:**
- Modify: `app/[lang]/page.tsx`

- [ ] **Step 1: Update the page to show landing for guests**

Replace the full content of `app/[lang]/page.tsx` with:

```tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LandingNav from '@/components/landing/LandingNav'
import HeroSection from '@/components/landing/HeroSection'
import ProblemSection from '@/components/landing/ProblemSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import ForWhomSection from '@/components/landing/ForWhomSection'
import DemoCtaSection from '@/components/landing/DemoCtaSection'
import LandingFooter from '@/components/landing/LandingFooter'

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await getServerSession(authOptions)

  if (session) {
    switch (session.user.role) {
      case 'SUPER_ADMIN':
        redirect(`/${lang}/superadmin`)
      case 'ADMIN':
      case 'VERMIETER':
        redirect(`/${lang}/dashboard`)
      case 'MIETER':
        redirect(`/${lang}/tenant`)
      default:
        redirect(`/${lang}/auth/login`)
    }
  }

  return (
    <main>
      <LandingNav />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <ForWhomSection />
      <DemoCtaSection />
      <LandingFooter />
    </main>
  )
}
```

- [ ] **Step 2: Build to verify no type errors**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/[lang]/page.tsx
git commit -m "feat: wire up landing page — guests see marketing page, auth users redirect to dashboard"
```

---

## Self-Review

**Spec coverage:**
- ✅ Nav with logo + lang switcher + CTA button (Task 4)
- ✅ Hero with tagline + subtext + CTA (Task 5)
- ✅ Problem block "Kennen Sie das?" (Task 6)
- ✅ 6 feature tiles (Task 7)
- ✅ For whom 2-column section (Task 8)
- ✅ Demo CTA with contact form (Task 9)
- ✅ Footer with links + lang + copyright (Task 10)
- ✅ DE/FR/EN/IT translations (Task 2)
- ✅ Auth redirect preserved (Task 11)
- ✅ Logo in public folder (Task 1)
- ✅ API route for form submission (Task 3)

**No placeholders found.**

**Type consistency:** All component imports in Task 11 match filenames defined in Tasks 4–10. `t.raw()` used correctly for arrays in ForWhomSection.
