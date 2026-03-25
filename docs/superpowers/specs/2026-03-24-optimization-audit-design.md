# ImmoManage — Optimierungs-Audit

**Datum**: 2026-03-24
**Scope**: Vollständiger Code-Audit der Applikation (Wartbarkeit, Struktur, Robustheit)
**Basis**: ~4.000 LOC handgeschriebener Code, 206 Quelldateien

---

## Befund-Zusammenfassung

| Priorität | Bereich | Problem |
|-----------|---------|---------|
| P1 | Server Actions | Auth-Boilerplate ~30× wiederholt |
| P1 | `/api/agent/chat` | 215 Zeilen, 9+ Verantwortlichkeiten |
| P2 | Zod Schemas | Create/Update-Varianten dupliziert |
| P2 | WeeklyCalendar | Datum-Logik + Strings hardcoded im Component |
| P2 | Error Handling | Inkonsistent (throw / null / error-object) |
| P3 | Rate Limiting | Dual-Implementation (Upstash + in-memory) |
| P3 | Tests | vitest konfiguriert, keine Tests vorhanden |
| P3 | Error Boundaries | Nur eine globale, keine pro Feature |
| P3 | Logging | Kein strukturiertes Logging |

---

## Task-Liste

### P1 — Hoher Impact (Kernarchitektur)

#### TASK-01: `withAuth`-Wrapper für Server Actions
**Problem**: Jede der ~30 Server Actions beginnt mit:
```typescript
const session = await getServerSession(authOptions)
if (!session?.user?.companyId) return null
const companyId = session.user.companyId as string
```
**Lösung**: Utility-Wrapper `withAuth(handler)` in `lib/action-utils.ts` extrahieren:
```typescript
export function withAuth<T>(handler: (session: Session) => Promise<T>) {
  return async (): Promise<T | null> => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) return null
    return handler(session)
  }
}
```
**Betroffene Dateien**: Alle `_actions.ts` in `dashboard/`, `tenant/`, `superadmin/`
**Aufwand**: Mittel (~2h Refactoring)

---

#### TASK-02: `getAccessibleWhere`-Helper konsolidieren
**Problem**: Role-based Filterlogik für Properties/Tenants dupliziert in mehreren `_actions.ts`-Dateien
**Lösung**: Zentralen Helper `lib/access-control.ts` erstellen:
```typescript
export function getPropertyWhere(session: Session) { ... }
export function getTenantWhere(session: Session) { ... }
```
**Betroffene Dateien**: `properties/_actions.ts`, `tenants/_actions.ts`, `leases/_actions.ts`, `tickets/_actions.ts`
**Aufwand**: Klein (~1h)

---

#### TASK-03: `/api/agent/chat` aufteilen
**Problem**: 215-Zeilen-Endpoint macht gleichzeitig:
1. Session-Validierung
2. Chat erstellen/laden
3. Lease-Daten assemblen
4. Utility-Bills fetchen
5. Vectra-Suche
6. Dokument-Fallback
7. Ollama-Streaming starten
8. Eskalations-Erkennung
9. Messages persistieren

**Lösung**: Orchestrator-Funktion in `lib/agent/chat-pipeline.ts` + separate Funktionen:
- `buildContext(session, chatId)` — DB-Daten zusammenführen
- `searchDocuments(query, companyId)` — Vectra + Fallback
- `streamResponse(context, messages)` — Ollama-Aufruf
- `persistMessage(chatId, content, role)` — Speicherung

**Betroffene Dateien**: `app/api/agent/chat/route.ts`
**Aufwand**: Mittel (~3h)

---

### P2 — Mittlerer Impact (Code-Qualität)

#### TASK-04: Zod Schemas mit Komposition vereinheitlichen
**Problem**: `createTenantSchema` und `updateTenantSchema` sind fast identisch (unterscheiden sich nur in Pflichtfeldern)
**Lösung**: Base-Schema + `.partial()` oder `.extend()` verwenden:
```typescript
const tenantBaseSchema = z.object({ name: ..., email: ..., ... })
export const createTenantSchema = tenantBaseSchema
export const updateTenantSchema = tenantBaseSchema.partial().extend({ id: z.string() })
```
**Betroffene Dateien**: `lib/schemas/tenant.ts`, `lease.ts`, `property.ts`, `ticket.ts`
**Aufwand**: Klein (~1h)

---

#### TASK-05: `WeeklyCalendar` aufteilen
**Problem**: 220-Zeilen-Component mischt Datum-Arithmetik, Event-Filterung, Farb-Mapping, deutsche Strings und UI-Rendering
**Lösung**: Extraktion in:
- `lib/date-utils.ts` — `getWeekStart()`, `getDaysOfWeek()`, `isSameDay()`
- `lib/calendar-colors.ts` — Event-Typ → Farb-Mapping
- `WeeklyCalendar.tsx` wird auf ~120 Zeilen reduziert

**Betroffene Dateien**: `components/calendar/WeeklyCalendar.tsx`
**Aufwand**: Klein (~1h)

---

#### TASK-06: Konsistentes Error Handling in Server Actions
**Problem**: Actions geben teils `null`, teils `{ error: string }`, teils thrown exceptions zurück — Clients müssen alle Fälle manuell prüfen
**Lösung**: `ActionResult<T>` konsequent in allen Actions verwenden (Typ existiert bereits in `lib/action-result.ts`):
```typescript
type ActionResult<T> = { success: true; data: T } | { success: false; error: string }
```
Alle Actions auf dieses Pattern umstellen.
**Betroffene Dateien**: Alle `_actions.ts`
**Aufwand**: Mittel (~2h)

---

### P3 — Nice to Have (Robustheit & Zukunftssicherheit)

#### TASK-07: Rate Limiting vereinheitlichen
**Problem**: Zwei verschiedene Implementierungen (Upstash für Prod, In-Memory für Dev) mit unterschiedlichem Verhalten
**Lösung**: Wrapper-Interface `RateLimiter` definieren, beide Implementierungen dahinter verstecken — oder: für Dev einfach immer erlauben (kein In-Memory-State nötig)
**Betroffene Dateien**: `lib/rate-limit.ts`
**Aufwand**: Klein (~30min)

---

#### TASK-08: Error Boundaries pro Feature-Sektion
**Problem**: Nur eine globale `error.tsx` im Dashboard. Fehler in einem Feature-Bereich reißen das gesamte Dashboard mit.
**Lösung**: `error.tsx` + `loading.tsx` in kritische Feature-Ordner hinzufügen:
- `app/dashboard/properties/error.tsx`
- `app/dashboard/tenants/error.tsx`
- `app/dashboard/tickets/error.tsx`
- `app/tenant/*/error.tsx`

**Aufwand**: Klein (~1h)

---

#### TASK-09: Basis-Tests für kritische Flows
**Problem**: vitest ist konfiguriert, aber keine Tests vorhanden
**Lösung**: Mindestens Tests für:
- `lib/access-control.ts` (Rollenlogik)
- `lib/schemas/*.ts` (Zod-Validierung)
- `lib/agent/escalation.ts` (Eskalations-Erkennung)

**Aufwand**: Mittel (~3h)

---

#### TASK-10: Strukturiertes Logging
**Problem**: Agent-Eskalationen, API-Fehler und kritische Operationen werden nicht geloggt
**Lösung**: Schlankes `lib/logger.ts` mit `console.log`-Wrapper + strukturierten Feldern (`level`, `action`, `userId`, `error`). Kein externes Logging-System nötig — bereits vorhandene `SystemLog`-Tabelle in der DB nutzen.
**Aufwand**: Klein (~1h)

---

## Priorisierungs-Reihenfolge

```
TASK-01 → TASK-02 → TASK-03   (P1, Kern-Refactoring)
TASK-04 → TASK-05 → TASK-06   (P2, Code-Qualität)
TASK-07 → TASK-08 → TASK-09 → TASK-10  (P3, Robustheit)
```

**Geschätzter Gesamtaufwand**: ~15 Stunden

---

## Nicht angefasst (bewusst ausgelassen)

- Prisma-generierte Dateien (`lib/generated/`) — auto-generiert, kein manuelles Refactoring
- `prisma/seed.ts` — Script, keine Produktions-Relevanz
- `components/ui/` — shadcn/ui-Wrapper, externe Library-Pattern
- Global-State-Management (Zustand) — kein aktueller Bedarf erkennbar
- Bundle-Optimierung — kein Performance-Problem identifiziert
