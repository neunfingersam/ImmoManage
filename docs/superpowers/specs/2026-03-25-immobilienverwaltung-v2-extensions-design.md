# Design Spec – Immobilienverwaltung V2 Erweiterungen
**Stand: März 2026 | Basis: bestehendes immo-manage Next.js Projekt**

---

## Kontext

Erweiterung des bestehenden immo-manage Projekts (Next.js 14, Prisma/SQLite, shadcn/ui) um die in specs.md definierten Mindestanforderungen. Ansatz: Foundation First — i18n zuerst, dann Schema-Erweiterungen, dann Features nach Priorität.

**Zielmarkt:** Schweiz (DE + FR + EN + IT)
**Zielgruppe:** Kleine Hausverwaltungen (1–10 MA) & private Eigentümer (3–15 Einheiten)

---

## Phase 1: Foundation

### 1.1 i18n Migration (next-intl)

**Bibliothek:** `next-intl`

**Routing:** Alle Routen wandern unter `app/[locale]/...`. Unterstützte Locales: `de` (default), `fr`, `en`, `it`.

**Dateistruktur:**
```
/messages
  de.json   ← vollständig
  fr.json   ← vollständig
  en.json   ← vollständig
  it.json   ← vollständig
```

**Migration:**
- `middleware.ts` wird um next-intl-Middleware erweitert (Locale-Detection, Redirect)
- Alle bestehenden Routen wandern unter `app/[locale]/`
- Komponenten erhalten `useTranslations()` statt hardcoded Strings
- Bestehende Strings in `de.json` erfassen, alle anderen Locales synchron halten

**Sprachumschalter:** In der Sidebar/Header — Dropdown mit Flaggen-Icons.

---

### 1.2 Prisma Schema-Erweiterungen

#### Erweiterungen bestehender Modelle

**Unit:**
```prisma
status    UnitStatus  @default(LEER)
photos    Json        @default("[]")
```
Neues Enum: `UnitStatus { VERMIETET LEER RENOVIERUNG }`

**User:**
```prisma
iban      String?   // für Mieter-Rückzahlungen
```

**Lease:**
```prisma
depositAmount    Float?
depositBank      String?
depositStatus    DepositStatus  @default(AUSSTEHEND)
indexierung      Boolean        @default(false)
referenzzinssatz Float?
handoverWizard   Json?          // Mieterwechsel-Assistent Fortschritt
```
Neues Enum: `DepositStatus { AUSSTEHEND HINTERLEGT FREIGEGEBEN }`

**UtilityBill:**
```prisma
costItems      Json   @default("[]")   // [{ name, amount, key }]
distributionKey Json  @default("{}")   // Schlüssel pro Kostenart
tenantShares   Json   @default("[]")   // berechneter Anteil pro Mieter
```

**Company:**
```prisma
onboardingCompleted Json?  // { step1: true, step2: false, ... }
smtpConfig          Json?  // SMTP-Einstellungen
```

#### Neue Modelle

**RentDemand** — monatliche Sollstellung:
```prisma
model RentDemand {
  id         String           @id @default(cuid())
  companyId  String
  leaseId    String
  month      DateTime         // 1. des Monats
  amount     Float
  status     RentDemandStatus @default(PENDING)
  dueDate    DateTime
  createdAt  DateTime         @default(now())
  company    Company          @relation(...)
  lease      Lease            @relation(...)
  payments   Payment[]
  reminders  PaymentReminder[]
}
```
Enum: `RentDemandStatus { PENDING PAID OVERDUE }`

**Payment** — Ist-Zahlung:
```prisma
model Payment {
  id            String        @id @default(cuid())
  companyId     String
  rentDemandId  String?
  leaseId       String
  amount        Float
  paymentDate   DateTime
  method        PaymentMethod @default(MANUAL)
  note          String?
  createdAt     DateTime      @default(now())
}
```
Enum: `PaymentMethod { MANUAL BANK_IMPORT }`

**PaymentReminder** — Mahnungen:
```prisma
model PaymentReminder {
  id            String   @id @default(cuid())
  companyId     String
  rentDemandId  String
  level         Int      // 1, 2 oder 3
  sentAt        DateTime
  createdAt     DateTime @default(now())
}
```

**Task** — Aufgaben & Erinnerungen:
```prisma
model Task {
  id            String     @id @default(cuid())
  companyId     String
  createdById   String
  title         String
  description   String?
  type          TaskType
  dueDate       DateTime
  status        TaskStatus @default(OFFEN)
  propertyId    String?
  tenantId      String?
  reminderDays  Int?
  createdAt     DateTime   @default(now())
}
```
Enum `TaskType { WARTUNG REPARATUR VERTRAGSVERLAENGERUNG BESICHTIGUNG SONSTIGES }`
Enum `TaskStatus { OFFEN IN_BEARBEITUNG ERLEDIGT }`

**ActivityLog** — Aktivitätsprotokoll:
```prisma
model ActivityLog {
  id          String   @id @default(cuid())
  companyId   String
  userId      String
  action      String
  entityType  String
  entityId    String?
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())
}
```

---

## Phase 2: Zahlungsverwaltung

### 2.1 Sollstellung

**Automatische Generierung:**
- API-Route `POST /api/payments/generate-demands` — erstellt `RentDemand`-Einträge für alle aktiven Leases des laufenden Monats
- Idempotent: prüft ob Eintrag für diesen Monat bereits existiert
- Aufruf: manuell per Button im Dashboard oder via externem Cron-Job
- Betrag: `lease.coldRent + lease.extraCosts`
- `dueDate`: konfigurierbar, Default 1. des Monats + 10 Tage

**Status-Logik:**
- `PENDING` → Standard nach Erstellung
- `PAID` → wenn `SUM(payments.amount) >= rentDemand.amount`
- `OVERDUE` → wenn `dueDate` überschritten und nicht `PAID`

### 2.2 UI `/dashboard/payments`

- Tabelle: Monat, Mieter, Objekt/Einheit, Soll-Betrag, Ist-Zahlung, Status-Badge, Aktionen
- Filter: Monat, Status, Objekt
- Modal „Zahlung erfassen": Datum, Betrag, Notiz
- Summen-KPIs: Offene Posten gesamt (CHF), Anzahl überfällig

### 2.3 QR-Rechnung (Demo-Layout)

**Bibliotheken:** `qrcode` + `@react-pdf/renderer`

**Pro RentDemand:** Button „QR-Rechnung" generiert PDF im Schweizer QR-Rechnung-Layout:
- Empfänger (Company-Name + Adresse aus DB)
- IBAN (aus Company-Einstellungen — Pflichtfeld, validiert als CH-IBAN-Format)
- Betrag in CHF
- Mieter-Referenz (Name + Monat)
- QR-Code (ISO 20022 konform im Demo-Modus — ohne echte Bankvalidierung)

PDF-Download und E-Mail-Versand direkt an Mieter.

### 2.4 Zahlungserinnerungen

**Konfiguration** pro Company: Tage nach Fälligkeit für Mahnung 1/2/3 (Defaults: 7/14/21 Tage).

**Logik:**
- Manuelle Auslösung per Button in Zahlungsübersicht
- Automatische Stufenwahl: prüft `MAX(reminders.level)` → nächste Stufe
- `PaymentReminder`-Eintrag wird erstellt
- E-Mail aus Mahnvorlage generiert (via SMTP)

---

## Phase 3: Nebenkostenabrechnung (Enhancement)

### Kostenpositionen & Verteilschlüssel

**Erfassung:** Im bestehenden UtilityBill-Formular neue Section „Kostenpositionen":
- Dynamische Liste: + Zeile hinzufügen (Name, Betrag CHF, Verteilschlüssel)
- Schlüssel-Optionen: `sqm` (nach m²) | `unit` (gleich pro Einheit) | `persons` (nach Personen)

**Berechnung** (Server-seitig, `lib/utility-billing.ts`):
```
Mieteranteil = (Einheit-Gewicht / Gesamt-Gewicht) * Kostenposition-Betrag
Saldo = Mieteranteil - geleistete NK-Akonto-Zahlungen
```

**OR-konformes PDF** via `@react-pdf/renderer`:
- Aufstellung aller Kostenpositionen mit Betrag und Schlüssel
- Einheit-spezifische Kenngrössen (m², Personen)
- Mieteranteil pro Position
- Gesamtbetrag + Saldo (Nachzahlung / Rückerstattung)

---

## Phase 4: Mieterwechsel-Assistent

**Route:** `/dashboard/tenants/[id]/handover-wizard`

**5-Schritte-Wizard:**

| Schritt | Felder | Persistenz |
|---|---|---|
| 1 – Kündigung | Kündigungsdatum, Bestätigung erhalten | `lease.handoverWizard.step1` |
| 2 – Nachmieter | Status (gesucht/gefunden), Notizen, geplanter Einzug | `lease.handoverWizard.step2` |
| 3 – Übergabe | Übergabedatum → verknüpft mit Handover-Modul | `lease.handoverWizard.step3` |
| 4 – Kaution | Kautionsbetrag, Abzüge (Liste), Rückzahlungsbetrag, IBAN des Mieters | `lease.handoverWizard.step4` |
| 5 – Neuer Mieter | Formular vorausgefüllt mit Objekt/Einheit | erstellt neuen User + Lease |

Fortschritt wird in `lease.handoverWizard` (JSON) gespeichert — Wizard kann unterbrochen und fortgesetzt werden.

---

## Phase 5: Excel-Import Onboarding

### Vorlage

Download einer `.xlsx`-Datei mit zwei Sheets:

**Sheet „Objekte":** Name, Adresse, Typ (MFH/EFH/Gewerbe), Anzahl Einheiten, Baujahr

**Sheet „Mieter":** Vorname, Nachname, E-Mail, Telefon, IBAN, Objekt-Name, Einheit-Nr, Mietbeginn, Mietende, Kaltmiete, NK

### Import-Flow `/dashboard/onboarding/import`

1. Datei hochladen (drag & drop)
2. Spalten-Mapping: User wählt welche Spalte zu welchem Feld gehört (Dropdown pro Spalte)
3. Validierung: Fehler zeilenweise anzeigen (fehlende Pflichtfelder, ungültige Formate, doppelte E-Mails)
4. Preview-Tabelle: was wird importiert
5. Import-Button → API-Route erstellt alle Objekte + Mieter + Leases in einer Transaktion

**Bibliothek:** `xlsx` (SheetJS)

### Geführtes Onboarding

5-Schritte-Banner (nur für neue Companies, dismissbar) im Dashboard:
1. Erstes Objekt anlegen
2. Erste Einheit anlegen
3. Ersten Mieter anlegen
4. Bankverbindung hinterlegen (für QR-Rechnung)
5. Dashboard erkunden

Fortschritt in `company.onboardingCompleted` gespeichert.

---

## Phase 6: CH-Vorlagen

**Route:** `/dashboard/templates`

**Verfügbare Vorlagen:**

| Vorlage | Sprachen |
|---|---|
| Mietvertrag | DE, FR, EN, IT |
| Wohnungsübergabeprotokoll | DE, FR, EN, IT |
| Kündigungsschreiben | DE, FR, EN, IT |
| Nebenkostenabrechnung | DE, FR, EN, IT |
| Mahnung 1. Stufe | DE, FR, EN, IT |
| Mahnung 2. Stufe | DE, FR, EN, IT |
| Mahnung 3. Stufe | DE, FR, EN, IT |

**Generierung:** `@react-pdf/renderer` mit Daten aus DB (Mieter, Objekt, Lease). Sprachauswahl via Dropdown vor PDF-Generierung. Vorlagentexte in `messages/[locale].json` unter dem Namespace `templates.*`.

---

## Phase 7: Aufgaben & Aktivitätsprotokoll

### Aufgaben `/dashboard/tasks`

- Aufgabe anlegen (Titel, Typ, Fälligkeit, Objekt/Mieter verknüpfen, Erinnerung X Tage vorher)
- Kanban-ähnliche Ansicht: OFFEN | IN_BEARBEITUNG | ERLEDIGT
- Dashboard-Widget: Aufgaben fällig in 7 / 30 Tagen

### Aktivitätsprotokoll `/dashboard/activity`

- Pro Company — zeigt wer was wann geändert hat
- `ActivityLog` wird bei kritischen Aktionen geschrieben: Mieter anlegen/löschen, Zahlung erfassen, Mahnung senden, Dokument hochladen, Lease erstellen/beenden
- Filterbar nach Zeitraum, Benutzer, Entitätstyp

---

## Phase 8: Dashboard Erweiterungen

Neue KPI-Cards im bestehenden Vermieter-Dashboard:

| KPI | Berechnung |
|---|---|
| Leerstandsquote | `(Units mit status=LEER / gesamt) * 100` |
| Offene Zahlungen | `SUM(RentDemand.amount WHERE status IN [PENDING, OVERDUE])` |
| Überfällige Zahlungen | Anzahl `RentDemand WHERE status=OVERDUE` |
| Vertragsenddaten | Leases die in ≤60 Tagen enden |

---

## Technische Entscheidungen

| Thema | Entscheid | Begründung |
|---|---|---|
| i18n | next-intl | Beste Next.js App Router Integration |
| Excel | xlsx (SheetJS) | Bewährt, keine externe Abhängigkeit |
| QR-Code | qrcode | Leichtgewichtig, gut dokumentiert |
| PDF | @react-pdf/renderer | Bereits im Projekt oder Standard für Next.js |
| Sprachen Phase 1 | alle 4 vollständig | User-Anforderung |
| Kautionsverwaltung | Felder auf Lease | Kein separates Model nötig |
| Wizard-State | JSON auf Lease | Einfach, kein separates Model nötig |

---

## Was bewusst NICHT gebaut wird

- CAMT.053 Bankimport (Should, nicht Must — zu komplex für Phase 1)
- Eigentümer-Portal (Phase 2 laut specs.md)
- Mobile App (Phase 2)
- KI-Features (specs.md explizit ausgeschlossen)
- FIBU-Integration (out of scope)

---

*Design erstellt: 2026-03-25*
