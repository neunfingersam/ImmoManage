# ImmoManage

Lokale Property-Management SaaS für Vermieter, Mieter und Verwaltungen. Gebaut mit Next.js 16, Prisma 7 (SQLite/libsql), NextAuth v4 und einem lokalen KI-Assistenten via Ollama.

---

## Features

- **Vermieter-Dashboard** — Immobilien, Einheiten, Mietverträge, Mieter, Dokumente, Kalender
- **Mieter-Portal** — Schadensmeldungen, Nachrichten, Dokumente, Termine, Zählerstände, KI-Assistent
- **KI-Agent** — RAG-basiert (Ollama + Vectra), liest alle Mieterdokumente & Vertragsdaten, Eskalation per E-Mail
- **Übergabeprotokoll** — Raum-für-Raum Dokumentation bei Ein-/Auszug
- **Zählerstand-Erfassung** — Strom, Gas, Wasser, Heizung
- **Nebenkostenabrechnung** — PDF-Export pro Mieter
- **Passwort-Reset** — via E-Mail Token
- **Mobile Responsive** — Hamburger-Navigation für kleine Bildschirme
- **SuperAdmin** — Mandantenverwaltung, Reindexierung, Systemlogs
- **Excel-Export** — Mieterliste als `.xlsx`

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Datenbank | SQLite via Prisma 7 + `@prisma/adapter-libsql` |
| Auth | NextAuth v4 (Credentials) |
| UI | Base UI + Tailwind CSS v4 |
| KI | Ollama (llama3 + nomic-embed-text) + Vectra LocalIndex |
| E-Mail | Nodemailer (lokal: Mailpit) |
| Exports | xlsx, HTML-Print |

---

## Setup

### Voraussetzungen

- Node.js 20+
- [Ollama](https://ollama.ai) (optional, für KI-Features)
- [Mailpit](https://mailpit.axllent.org) (optional, für E-Mail-Features)

### Installation

```bash
git clone https://github.com/neunfingersam/ImmoManage.git
cd ImmoManage

# Abhängigkeiten installieren
npm install

# Umgebungsvariablen einrichten
cp .env.example .env.local
# .env.local öffnen und NEXTAUTH_SECRET setzen:
# openssl rand -base64 32

# Datenbank migrieren & Client generieren
npx prisma migrate deploy
npx prisma generate

# Demo-Daten einspielen (optional)
npm run db:seed

# Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

### Demo-Zugänge (nach Seed)

| Rolle | E-Mail | Passwort |
|---|---|---|
| Super Admin | superadmin@demo.com | demo1234 |
| Admin/Vermieter | admin@demo.com | demo1234 |
| Mieter | mieter@demo.com | demo1234 |

---

## Umgebungsvariablen

Siehe `.env.example` für alle Variablen. Pflichtfelder:

| Variable | Beschreibung |
|---|---|
| `DATABASE_URL` | SQLite-Pfad oder libsql-URL |
| `NEXTAUTH_SECRET` | Zufälliger Secret (min. 32 Zeichen) |
| `NEXTAUTH_URL` | Öffentliche URL der App |

Optional:

| Variable | Standard | Beschreibung |
|---|---|---|
| `SMTP_HOST` | `localhost` | SMTP-Server |
| `SMTP_PORT` | `1025` | SMTP-Port |
| `SMTP_SECURE` | `false` | TLS aktivieren |
| `SMTP_FROM` | `noreply@immomanage.local` | Absenderadresse |
| `SMTP_USER` | — | SMTP-Benutzername |
| `SMTP_PASS` | — | SMTP-Passwort |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama-Endpunkt |

---

## KI-Assistent einrichten

```bash
# Ollama installieren: https://ollama.ai
ollama pull llama3
ollama pull nomic-embed-text
```

Dokumente werden automatisch indexiert wenn sie hochgeladen werden. Manuelle Neuindexierung über SuperAdmin → "Dokumente neu indexieren".

---

## Produktion

Für Produktion empfohlen:
- **Datenbank**: [Turso](https://turso.tech) (libsql, `DATABASE_URL=libsql://...`)
- **Hosting**: Vercel, Railway oder eigener Server
- **E-Mail**: Resend, Postmark oder SendGrid
- **NEXTAUTH_SECRET**: starkes Geheimnis setzen

```bash
npm run build
npm start
```
