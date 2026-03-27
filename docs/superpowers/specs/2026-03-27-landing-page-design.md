# Landing Page – ImmoManage
**Stand: 27. März 2026**

---

## Kontext

Marketing Landing Page für immo-manage.ch. Ziel: Besucher verstehen sofort was ImmoManage ist, fühlen sich angesprochen und buchen eine Demo.

- **Plattform:** Bestehende Next.js App (next-intl bereits vorhanden)
- **Route:** `/` — unangemeldete Besucher sehen Landing Page, eingeloggte werden zu `/dashboard` weitergeleitet
- **Sprachen:** DE, FR, EN, IT
- **Stil:** Clean SaaS (viel Weissraum, Orange als Akzent) + Problem-First Struktur

---

## Brand

- **Logo:** `Immo-Manage-Logo.png` — iM in Orange mit Icons
- **Primärfarbe:** Orange `#E8622A`
- **Tagline:** "Schluss mit Zettelwirtschaft. Willkommen bei ImmoManage."

---

## Seitenstruktur

### 1. Navigation
- Links: ImmoManage Logo
- Mitte: —
- Rechts: Sprachauswahl (DE / FR / EN / IT) + "Demo buchen" Button (orange)
- Sticky bei Scroll

### 2. Hero Section
- **Headline:** "Schluss mit Zettelwirtschaft. Willkommen bei ImmoManage."
- **Subtext:** "Die Schweizer Lösung für Hausverwaltungen und private Eigentümer — einfach, vollständig, CH-konform."
- **CTA:** Button "Demo buchen" (orange, prominent)
- **Visual:** App-Screenshot rechts oder Logo gross zentriert

### 3. Problem-Block ("Kennen Sie das?")
3 Karten mit Schmerzpunkten der Zielgruppe:
1. "Excel-Tabellen die nie stimmen"
2. "QR-Rechnungen manuell erstellen kostet Stunden"
3. "Mieter anrufen statt alles digital erledigen"

### 4. Features (6 Kacheln)
| Feature | Icon | Kurzbeschreibung |
|---------|------|-----------------|
| Objekte & Einheiten | Gebäude | Alle Liegenschaften auf einen Blick |
| Mieter & Verträge | Person | Stammdaten, Verträge, Mieterwechsel-Assistent |
| Zahlungen & QR-Rechnung | CHF | CH-konform, CAMT.053 Import, automatische Mahnungen |
| Mieter-Portal | Chat | Tickets, Dokumente, Nachrichten — alles digital |
| KI-Assistent | Stern | Automatisierte Unterstützung im Verwaltungsalltag |
| Dokumente & Vorlagen | Dokument | CH-spezifische Vorlagen (DE + FR), digitale Ablage |

### 5. Für wen
Zwei Spalten:
- **Kleine Hausverwaltungen (1–10 MA):** Professionelle Verwaltung, mehrere Objekte, Team-Zugang
- **Private Eigentümer (3–15 Einheiten):** Einfacher Einstieg, kein IT-Wissen nötig, günstig

### 6. Demo CTA Section
- Headline: "Überzeugen Sie sich selbst"
- Kontaktformular: Name, E-Mail, Nachricht (optional)
- Button: "Demo anfragen" (orange)
- Hinweis: Wird später durch Cal.com-Link ersetzt

### 7. Footer
- Logo
- Links: Datenschutz, Impressum
- Sprachauswahl
- © 2026 ImmoManage · Schweiz

---

## Technische Umsetzung

- **Route:** `app/[lang]/page.tsx` — neuer Public-Handler (kein Auth-Check)
- **Root Redirect:** `app/page.tsx` — eingeloggte User → Dashboard, nicht eingeloggte → Landing
- **i18n:** Alle Texte in `messages/[lang].json` (de, fr, en, it)
- **Formular:** Server Action → E-Mail via bestehendem SMTP
- **Styling:** Tailwind CSS (bereits vorhanden), Primärfarbe `#E8622A`

---

## Nicht in Scope

- Pricing-Seite (später)
- Blog / Ressourcen
- Video-Demo eingebettet
- Cal.com Integration (Platzhalter-Formular zuerst)
