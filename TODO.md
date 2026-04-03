# ImmoManage — Offene Tasks

Stand: 2026-03-29

---

## ✅ Modul 1: Liegenschaft & Eigentümer-Setup (DONE)

- Schema (10 neue Tabellen, 3 Enums, erweiterte Property + PropertyOwner)
- Migration SQL gegen Turso DB ausgeführt (`weg_module1.sql`)
- WEG-Listenansicht (`/dashboard/weg`)
- Detailseite pro WEG-Liegenschaft (`/dashboard/weg/[propertyId]`)
- Eigentümerverwaltung mit Wertquote-Bar (`/dashboard/weg/[propertyId]/owners`)
- Setup-Wizard (2-Step)
- Sidebar-Eintrag + i18n

---

## 🔲 Modul 2: Erneuerungsfonds

**Seite:** `/dashboard/weg/[propertyId]/fonds`

### Features
- [ ] Prognose-Chart (20 Jahre): Recharts LineChart, Fonds-Entwicklung basierend auf Beitragssatz + geplanten Erneuerungskosten
- [ ] Ampel-Status: Grün / Gelb / Rot je nach Deckungsgrad (fondsStand vs. geplante Kosten)
- [ ] Erneuerungsplan-Tabelle: Bauteil, Restlebensdauer, Erneuerungskosten, Jahr
- [ ] CRUD für `RenewalPlanItem` (Add / Edit / Delete)
- [ ] Fonds-Einstellungen: Beitragssatz (%), Obergrenze (Monatslöhne), aktueller Fondsstand
- [ ] Fondsstand manuell aktualisieren (letzte Einzahlung)
- [ ] Export: PDF-Bericht "Erneuerungsfonds" (Tabelle + Chart)

### Datenmodell (bereits in DB)
- `WegConfig.fondsStand`, `fondsBeitragssatz`, `fondsObergrenze`, `fondsLetzteEinzahlung`
- `RenewalPlanItem`: id, wegConfigId, bauteil, restlebensdauer, erneuerungskosten, letzteErneuerung

---

## 🔲 Modul 3: Kosten & Rechnungsmodul

**Seite:** `/dashboard/weg/[propertyId]/kosten`

### Features
- [ ] Gemeinschaftskosten-Liste (`CommunityExpense`): Kategorie, Betrag, Rhythmus, Status, Lieferant
- [ ] CRUD für Gemeinschaftskosten
- [ ] Eigentümer-Umlageschlüssel: nach Wertquote oder gleich aufteilen
- [ ] `OwnerExpensePayment` generieren: pro Rechnung automatisch Zahlungen für alle Eigentümer erstellen
- [ ] Zahlungsstatus pro Eigentümer (Offen / Bezahlt)
- [ ] Jahresabrechnung PDF: Auflistung aller Kosten, Anteil pro Eigentümer
- [ ] Filter: Jahr, Kategorie, Status
- [ ] Kategorien: VERSICHERUNG, HAUSWART, ENERGIE, VERWALTUNG, UNTERHALT, SONSTIGES

### Datenmodell (bereits in DB)
- `CommunityExpense`: id, wegConfigId, kategorie, beschreibung, betrag, rhythmus, status, lieferant, faelligkeitsdatum
- `OwnerExpensePayment`: id, expenseId, ownerId, betrag, bezahltAm, status

---

## 🔲 Modul 4: Steuermodul

**Seite:** `/dashboard/weg/[propertyId]/steuern` (Verwalter-Sicht)
**Seite:** `/dashboard/weg/steuern` (Eigentümer-Sicht via `getMyWegData`)

### Features
- [ ] Steuerjahr-Selektor
- [ ] Eigenmietwert pro Eigentümer erfassen
- [ ] Abzugsmethode: PAUSCHAL (10% bis CHF 6'000) oder EFFEKTIV
- [ ] Steuerabzüge erfassen (`WegTaxDeduction`): Datum, Beschreibung, Betrag, Kategorie
- [ ] Automatische Berechnung: Pauschalabzug vs. effektive Abzüge, welcher günstiger
- [ ] Export PDF: Steuerbeilage pro Eigentümer (Eigenmietwert, Hypothek, Abzüge, Nettobelastung)
- [ ] Kantons-spezifische Hinweise (26 Kantone bereits in `lib/weg-cantons.ts`)

### Datenmodell (bereits in DB)
- `WegTaxEntry`: id, ownerId, steuerjahr, kanton, eigenmietwert, abzugsmethode
- `WegTaxDeduction`: id, taxEntryId, datum, beschreibung, betrag, kategorie

---

## 🔲 Modul 5: Versammlungsmodul

**Seite:** `/dashboard/weg/[propertyId]/versammlungen`

### Features
- [ ] Versammlungs-Liste mit Status (GEPLANT / DURCHGEFÜHRT / ABGESAGT)
- [ ] Versammlung erstellen: Datum, Ort, Einladungsfrist (Default: 10 Tage)
- [ ] Traktanden (`AgendaItem`) verwalten: Position, Titel, Beschreibung, Antragsteller
- [ ] Anwesenheitsliste (`AssemblyAttendance`): Eigentümer anwesend / vertreten
- [ ] Abstimmungen (`AssemblyVote`): JA / NEIN / ENTHALTUNG pro Eigentümer pro Traktandum
- [ ] Abstimmungsergebnis: gewichtete Auswertung nach Wertquote
- [ ] Protokoll-Textfeld (Markdown/Freitext)
- [ ] Einladungs-PDF: Traktandenliste, Datum, Ort
- [ ] Protokoll-PDF: Anwesenheit, Abstimmungsergebnisse, Protokolltext
- [ ] E-Mail-Einladung an alle Eigentümer (mit Einladungs-PDF im Anhang)

### Datenmodell (bereits in DB)
- `Assembly`: id, wegConfigId, datum, ort, einladungsFrist, status, protokoll
- `AgendaItem`: id, assemblyId, position, titel, beschreibung, antragsteller
- `AssemblyVote`: id, agendaItemId, ownerId, stimme (JA/NEIN/ENTHALTUNG)
- `AssemblyAttendance`: id, assemblyId, ownerId, anwesend

---

## 🔲 Modul 6: Eigentümer-Portal

**Seite:** `/dashboard/weg/meine-daten` (nur für EIGENTUEMER-Rolle)

### Features
- [ ] Eigentümer sieht seine eigene WEG-Übersicht (via `getMyWegData`)
- [ ] Meine Liegenschaft: Wertquote, Hypothek, IBAN
- [ ] Meine offenen Zahlungen (aus `OwnerExpensePayment`)
- [ ] Meine Steuerunterlagen (aus `WegTaxEntry`)
- [ ] Nächste Versammlung inkl. Traktanden
- [ ] Sidebar-Eintrag nur für EIGENTUEMER-Rolle sichtbar

---

## 🔲 Modul 7: Dashboard & Reporting

**Seite:** `/dashboard/weg/[propertyId]` (erweitern)

### Features
- [ ] WEG-Übersicht-Dashboard erweitern:
  - Fonds-Ampel (Ampelstatus aus Modul 2)
  - Offene Zahlungen Gesamt-CHF
  - Nächste Versammlung
  - Letzte Aktivität (Audit-Log)
- [ ] Jahresabrechnung-Generator: kombiniert Kosten + Zahlungen + Fonds für ein Steuerjahr
- [ ] WEG-weite Suche (Eigentümer, Kosten, Versammlungen)

---

## 🔲 Sonstige offene Punkte

- [ ] i18n: WEG-Texte in `messages/de.json` sind nur teilweise vorhanden — fehlende Keys ergänzen wenn Modul gebaut wird
- [ ] Sidebar: `owners`-Eintrag (`/dashboard/owners`) prüfen — für WEG-Eigentümer oder nur für Mieteigentümer?
- [ ] Navigation für WEG-Unterseiten (Fonds, Kosten, Steuern, Versammlungen) — Sub-Navigation oder Tabs auf Detailseite
- [ ] Turso DB: Migrations-Workflow dokumentieren — bei neuen Feldern immer SQL manuell via `turso db shell` ausführen

---

## Technische Hinweise für neue Session

### Stack
- Next.js 16.2, React 19, TypeScript
- Prisma + `@prisma/adapter-libsql` (kein `prisma db push` via Vercel — nur manuell via Turso shell)
- Turso (LibSQL) als Produktionsdatenbank
- `lib/generated/prisma/index.ts` wird NICHT mehr committed — wird im Build-Script automatisch generiert
- SCHEMA_VERSION in `lib/prisma.ts` bei Schema-Änderungen erhöhen (aktuell: 4)

### Wichtige Dateien
- Schema: `prisma/schema.prisma`
- WEG Server Actions: `app/[lang]/dashboard/weg/_actions.ts`
- WEG Detailseite: `app/[lang]/dashboard/weg/[propertyId]/page.tsx`
- Sidebar: `components/layout/DashboardSidebar.tsx`
- i18n Keys: `messages/de.json`
- Kantone: `lib/weg-cantons.ts`

### Bei neuen DB-Feldern
1. Schema in `prisma/schema.prisma` ergänzen
2. `npx prisma generate` lokal ausführen
3. SQL-Migration schreiben (Vorlage: `prisma/migrations/weg_module1.sql`)
4. SQL via `turso db shell <db-name> < migration.sql` ausführen
5. SCHEMA_VERSION in `lib/prisma.ts` erhöhen
6. `lib/generated/prisma/index.ts` mit `git add -f` committen
