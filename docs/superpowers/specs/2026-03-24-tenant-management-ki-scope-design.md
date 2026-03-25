# Design Spec: Mieter-Management & KI-Scope

**Datum:** 2026-03-24
**Status:** Genehmigt

---

## Feature 1: Mieter-Management

### 1a. Mieter-Detailseite `/dashboard/tenants/[id]`

**Zugriff:** ADMIN (alle Mieter der Company), VERMIETER (nur Mieter mit aktivem Lease auf zugewiesenen Properties)

**Bereiche:**

- **Daten bearbeiten:** Name, Telefon, WhatsApp, E-Mail. Kein Passwort-Reset (eigener Flow).
- **Aktueller Mietvertrag:** Read-only Anzeige (Objekt, Einheit, Laufzeit, Miethöhe).
- **Mieter umziehen:** Sichtbar wenn aktiver Lease existiert.
  - Picker: Property (rollenbasiert gefiltert) → freie Einheit
  - Aktion: Alter Lease endet heute, neuer Lease mit gleichen Konditionen in neuer Einheit

**TenantCard:** Erhält Link zur Detailseite.

### 1b. Tenant Self-Edit `/tenant/profile`

Felder: Name, Telefon, WhatsApp, E-Mail. Nur eigene Daten.

---

## Feature 2: KI-Scope Fix

### Tenant-KI `/api/agent/chat` — keine Änderung nötig ✅

### Admin/Vermieter-KI `/api/agent/admin-chat`

**Bug 1 — RAG-Scope:**
`queryChunks` wird erweitert um role-based filtering:
- ADMIN: alle Company-Dokumente (TENANT + PROPERTY + GLOBAL)
- VERMIETER: PROPERTY-Docs zugewiesener Objekte + GLOBAL + TENANT-Docs ihrer Mieter

**Bug 2 — DB-Kontext ungefiltert für VERMIETER:**
Vor DB-Queries `PropertyAssignment`-IDs laden, dann Properties/Leases/Tickets/Tenants darauf filtern. ADMIN behält vollen Zugriff.

### Neue Chat-UI `/dashboard/chat`

Einfache Chat-Seite für ADMIN und VERMIETER, analog zum Tenant-Chat.

---

## Betroffene Dateien

**Neu:**
- `app/dashboard/tenants/[id]/page.tsx`
- `app/dashboard/tenants/[id]/TenantEditForm.tsx`
- `app/dashboard/tenants/[id]/MoveUnitDialog.tsx`
- `app/tenant/profile/page.tsx`
- `app/tenant/profile/_actions.ts`
- `app/dashboard/chat/page.tsx`

**Geändert:**
- `app/dashboard/tenants/_actions.ts` — `getTenant()`, `updateTenant()`, `moveTenantToUnit()`
- `components/tenants/TenantCard.tsx` — Link zur Detailseite
- `lib/agent/vectra.ts` — role-based RAG-Filter
- `app/api/agent/admin-chat/route.ts` — VERMIETER-Scope + RAG-Fix
