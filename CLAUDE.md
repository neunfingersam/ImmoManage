# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Next.js Version Warning

This project uses **Next.js 16**, which has breaking changes compared to earlier versions. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. APIs, conventions, and file structure may differ from your training data.

## Commands

```bash
# Development
npm run dev

# Build (generates Prisma client first, then Next.js build)
npm run build

# Tests
npm run test          # run once
npm run test:watch    # watch mode

# Database
npx prisma migrate dev --name <name>   # create + apply migration (local dev)
npx prisma migrate deploy              # apply pending migrations (production/CI)
npx prisma generate                    # regenerate Prisma client
npm run db:seed                        # seed demo data
```

**Run a single test file:**
```bash
npx vitest run __tests__/schemas/auth.test.ts
```

## Architecture

### Routing
All user-facing routes are under `app/[lang]/` for i18n support. The `[lang]` segment is `de`, `en`, `fr`, or `it` (default: `de`). Role-based portals:
- `[lang]/dashboard/` — ADMIN, VERMIETER
- `[lang]/tenant/` — MIETER
- `[lang]/owner/` — EIGENTUEMER
- `[lang]/superadmin/` — SUPER_ADMIN

**Critical:** The real post-login entry point is `app/[lang]/page.tsx`, not `app/page.tsx` (NextAuth redirects to `/${lang}` via next-intl middleware). Both files must contain the full role→redirect mapping including `EIGENTUEMER`. Missing the `EIGENTUEMER` case causes an infinite redirect loop (falls through to login, which redirects back). Always update both files when changing redirect logic.

### Data Access
- Prisma client singleton: `lib/prisma.ts` — server-only
- Role-scoped query helpers: `lib/access-control.ts` — use these to enforce that VERMIETER only see their own properties/tenants
- All mutations use Next.js Server Actions (not API routes)
- API routes (`app/api/`) exist only for: NextAuth, AI agent, file uploads, QR invoice PDF generation, exports
- Standard server action response type: `lib/action-result.ts`

### Auth
NextAuth v4 with Credentials provider (`lib/auth.ts`). JWT strategy. Session includes `id`, `email`, `name`, `role`, `companyId`. Rate limiting on login via Upstash (Upstash Redis). Password resets use `PasswordResetToken` DB model + email. JWT re-validates user.active and role every 5 minutes.

### Prisma / Database
- Local: SQLite (`prisma/schema.prisma`, `DATABASE_URL=file:./dev.db`)
- Production: Turso via `@prisma/adapter-libsql` (`DATABASE_URL=libsql://...`, `DATABASE_AUTH_TOKEN`)
- Prisma uses `prisma-client` provider (NOT `prisma-client-js`) — generated client goes to `lib/generated/prisma/`
- Build quirk: `npm run build` generates the Prisma client AND writes `lib/generated/prisma/index.ts` — this file must exist for imports to resolve
- After schema changes: `npx prisma migrate dev --name <name>` then `npx prisma generate`
- For Turso/production: use `npx prisma migrate deploy` (not `migrate dev`)

### AI Agent (RAG)
- Local Ollama: `llama3`/`llama3.2` for chat, `nomic-embed-text` for embeddings (`OLLAMA_BASE_URL`)
- Vector store: Vectra LocalIndex at `data/vectors/` (file-based, no external service)
- Document indexing: `lib/agent/indexDocument.ts` — chunks text, embeds, stores with metadata (companyId, tenantId, propertyId)
- Chat context: `lib/agent/chat-context.ts` — retrieves relevant chunks by metadata filter
- Escalation: `lib/agent/escalation.ts` — keyword-based auto-escalation to staff via email

### i18n
- `next-intl` v4 — translation keys in `messages/{de,en,fr,it}.json`
- Server-side config: `i18n/request.ts` | Routing config: `i18n/routing.ts`
- Missing translation keys cause runtime errors — always add keys to all 4 locale files
- When adding new `DocumentCategory` enum values, add translation keys to **both** the `tenant` and `owner` namespaces in all 4 language files

### Documents
Three portals show documents with different access levels:
- **Dashboard** (ADMIN/VERMIETER): all company docs, upload/delete, AI summary, folder tree
- **Tenant** (MIETER): own docs + active lease property docs + GLOBAL scope; no upload; no folder tree
- **Owner** (EIGENTUEMER): own docs + owned property docs + GLOBAL scope; no upload; folder tree if 1 property

All 11 `DocumentCategory` values are: `MIETVERTRAG`, `HAUSORDNUNG`, `NEBENKOSTENABRECHNUNG`, `UEBERGABEPROTOKOLL`, `SONSTIGES`, `EINLADUNG`, `VERSAMMLUNGSPROTOKOLL`, `VOLLMACHT`, `JAHRESRECHNUNG`, `BUDGET`, `HAUSWART_BELEG`.

### Emails
- Local dev: Nodemailer → Mailpit on `localhost:1025`
- Production: Resend (`RESEND_API_KEY`), sender `ImmoManage <noreply@immo-manage.ch>`
- **Do not use `<img>` tags in emails** — use text instead

### Roles
The 5 roles are: `SUPER_ADMIN`, `ADMIN`, `VERMIETER`, `MIETER`, `EIGENTUEMER`. The `EIGENTUEMER` role is newer — check `lib/access-control.ts` before adding new role-gated features; the helper may not yet handle it.

### Testing
Vitest with jsdom. Tests live in `__tests__/` organized by: `schemas/`, `utils/`, `agent/`. Setup file: `__tests__/setup.ts`.
