# App-Audit: Verbesserungen & Bugfixes

Erstellt: 2026-05-03

---

## 1. Kritische Bugs

### 1.1 Email-Verifizierung leitet immer auf `/de/` weiter

**Datei:** `app/api/auth/verify-email/route.ts` — Zeilen 10, 16, 21, 31

Alle vier `redirect()`-Aufrufe sind hardcoded auf `/de/auth/login`. Benutzer, die sich auf Englisch, Französisch oder Italienisch registriert haben, landen nach dem Klick auf den Verifizierungslink auf der deutschen Login-Seite. Da der `verified=1`- bzw. `verifyError=*`-Parameter mitgegeben wird, funktioniert das Feedback nur auf Deutsch.

**Fix:** Sprache aus dem Token-Datensatz (User-Präferenz) oder via Default-Locale ermitteln und dynamisch einsetzen, z.B.:
```ts
redirect(`/de/auth/login?verified=1`)
// ersetzen durch:
redirect(`/${locale}/auth/login?verified=1`)
```

---

### 1.2 Eigentümer-Einladungslinks hardcoded auf `/de/`

**Dateien:**
- `app/[lang]/dashboard/owners/_actions.ts` — Zeile 68
- `app/[lang]/dashboard/weg/_actions.ts` — Zeile 214

Beide erzeugen:
```ts
const inviteUrl = `${baseUrl}/de/auth/reset-password?token=${token}`
```

Eigentümer mit einer anderen Sprache erhalten einen funktionierenden Link (das Token ist gültig), landen aber immer auf der deutschen Seite.

**Fix:** Default-Locale aus `i18n/routing.ts` importieren oder `de` durch eine Konstante ersetzen:
```ts
import { defaultLocale } from '@/i18n/routing'
const inviteUrl = `${baseUrl}/${defaultLocale}/auth/reset-password?token=${token}`
```

---

## 2. Funktional fehlerhafte Features

### 2.1 Stripe-Checkout-Weiterleitungen hardcoded auf `/de/`

**Datei:** `app/api/register/route.ts` — Zeilen 134–135

```ts
successUrl: `${baseUrl}/de/dashboard?checkout=success`,
cancelUrl: `${baseUrl}/de/preise`,
```

Nach erfolgreichem Checkout oder Abbruch landen Nutzer immer auf der deutschen Version, unabhängig von der gewählten Sprache.

**Fix:** Locale aus dem Request-Kontext oder via Default-Locale einsetzen.

---

### 2.2 Zahlungserinnerung sendet keine E-Mail

**Datei:** `app/[lang]/dashboard/payments/_actions.ts` — Zeile 145

```ts
// TODO Plan D: E-Mail aus Mahnvorlage generieren und senden
// Für jetzt: nur DB-Eintrag
```

`sendReminderAction` erstellt nur einen `PaymentReminder`-Eintrag in der DB. Die E-Mail wird nicht gesendet. Der Button in der UI suggeriert, dass eine Mahnung per E-Mail versandt wird.

**Fix:** E-Mail-Versand implementieren — Mieter-Kontakt aus dem verknüpften `RentDemand → Lease → Tenant` laden und E-Mail aus Mahnvorlage senden.

---

### 2.3 `recordPaymentSchema` — datetime-Validierung zu streng

**Datei:** `app/[lang]/dashboard/payments/_actions.ts` — Zeile 13

```ts
paymentDate: z.string().datetime(),
```

`z.string().datetime()` akzeptiert nur vollständige ISO-8601-Strings mit Zeitanteil (z.B. `2024-01-15T00:00:00Z`). Wenn das Frontend ein Datum ohne Zeit sendet (`2024-01-15`), schlägt die Validierung stillschweigend fehl.

**Fix:**
```ts
paymentDate: z.string().min(1),
// oder:
paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
```

---

### 2.4 Server Actions werfen Fehler statt `ActionResult` zurückzugeben

Die folgenden Actions verwenden `throw new Error(...)` statt das `ActionResult<T>`-Muster. Nicht abgefangene Fehler auf dem Client führen zu unkontrollierten Abstürzen ohne Benutzer-Feedback.

| Datei | Problem |
|---|---|
| `dashboard/payments/_actions.ts` | `recordPaymentAction`, `bulkRecordPaymentsAction`, `sendReminderAction` — throw statt return |
| `dashboard/tenants/[id]/handover-wizard/_actions.ts` | Zeile 20 — `throw new Error('Unauthorized')` |
| `dashboard/tasks/_actions.ts` | `throw new Error('Unauthorized')` |
| `dashboard/team/_actions.ts` | `requireAdmin()` throws |
| `superadmin/companies/_actions.ts` | `requireSuperAdmin()` throws |
| `superadmin/admins/_actions.ts` | `requireSuperAdmin()` throws |

**Fix-Muster:**
```ts
// Statt:
if (!session) throw new Error('Unauthorized')

// So:
if (!session) return { success: false, error: 'Nicht autorisiert' }
```

---

## 3. Cache-Invalidierung fehlt fur nicht-deutsche Locales

### Problem

Alle folgenden Dateien verwenden `revalidatePath('/dashboard/...')` (ohne Locale-Prefix) statt `revalidateAllLocales(...)`. Nach einer Mutation wird nur der Cache der deutschen Route ungültig. Benutzer in en/fr/it sehen nach Aktionen veraltete Daten bis zum nächsten Hard-Refresh.

**Fix-Muster:**
```ts
// Statt:
import { revalidatePath } from 'next/cache'
revalidatePath(`/dashboard/tickets/${ticketId}`)

// So:
import { revalidateAllLocales } from '@/lib/revalidate'
revalidateAllLocales(`/dashboard/tickets/${ticketId}`)
```

### Betroffene Dateien

| Datei | Zeilen |
|---|---|
| `dashboard/tickets/_actions.ts` | 76, 100, 119 |
| `dashboard/messages/_actions.ts` | 112 |
| `dashboard/handovers/_actions.ts` | 113 |
| `dashboard/properties/_actions.ts` | 73, 86, 145, 203, 232, 265 |
| `dashboard/tenants/_actions.ts` | 171, 242 |
| `dashboard/notifications/_actions.ts` | 33 |
| `superadmin/companies/_actions.ts` | 41, 53, 69, 70 |
| `superadmin/admins/_actions.ts` | 88, 97 |
| `superadmin/messages/_actions.ts` | 87 |
| `owner/tickets/_actions.ts` | 63 |
| `owner/messages/_actions.ts` | 54 |
| `tenant/tickets/_actions.ts` | 71, 103 |
| `tenant/messages/_actions.ts` | 75 |
| `tenant/meters/_actions.ts` | 51 |
| `tenant/profile/_actions.ts` | 33 |
| `weg/[propertyId]/budget/_actions.ts` | 82, 94 |
| `weg/[propertyId]/hauswart/_actions.ts` | 60, 79, 91 |
| `weg/[propertyId]/jahresabrechnung/_actions.ts` | 76, 86 |
| `weg/[propertyId]/assembly/[id]/attendance/_actions.ts` | 72, 95 |

---

## 4. Nicht übersetzte Seiten (hardcodiertes Deutsch)

### 4.1 Zählerstände-Seite

**Datei:** `app/[lang]/dashboard/meters/page.tsx`

Die gesamte Seite verwendet hardcodierte deutsche Strings:
- `"Zählerstände"` (Seitentitel)
- `"Keine Ablesungen"` (EmptyState-Titel)
- `"Noch keine Zählerstände von Mietern eingereicht."` (EmptyState-Beschreibung)
- `"Ablesungen"` (Subtitel-Zähler)
- `typeLabels`-Objekt mit deutschen Werten

**Fix:** `getTranslations('meters')` einbinden und Schlüssel in alle 4 Locale-Dateien eintragen.

### 4.2 Superadmin — Admin-Einladungs-E-Mail

**Datei:** `app/[lang]/superadmin/admins/_actions.ts` — Zeile 79

```ts
<p><a href="https://immo-manage.ch/de/auth/login" ...>Zum Login</a></p>
```

Der Login-Link in der Willkommens-E-Mail an neue Admins ist hardcoded auf Deutsch und auf die Production-URL.

**Fix:** `process.env.NEXTAUTH_URL` verwenden und Locale dynamisch einsetzen.

---

## 5. Bekannte TODOs / Unvollständige Features

### 5.1 Nebenkostenabrechnung: Personenanzahl hardcoded

**Datei:** `app/[lang]/dashboard/billing/_actions.ts`

```ts
persons: 2  // TODO: aus Lease/Tenant laden
```

Die Anzahl Personen für die Nebenkostenabrechnung ist fest auf `2` gesetzt statt aus dem Mietvertrag oder Mieterprofil geladen zu werden.

### 5.2 Tenant-Einladungs-URL fehlt Locale-Prefix

**Datei:** `app/[lang]/dashboard/tenants/_actions.ts` — Zeile 75

Die Einladungs-URL für Mieter fehlt den Locale-Prefix (ähnlich wie Punkt 1.2).

---

## Zusammenfassung nach Priorität

| Priorität | Anzahl | Beschreibung |
|---|---|---|
| Kritisch | 2 | Email-Verifizierung broken, Owner-Invite-Links falsch |
| Hoch | 4 | Stripe-Redirect, Reminder ohne E-Mail, datetime-Validierung, Actions die werfen |
| Mittel | 19 Dateien | revalidatePath ohne Locale |
| Niedrig | 3 | Nicht übersetzte Seite, hardcodierter Login-Link, TODOs |
