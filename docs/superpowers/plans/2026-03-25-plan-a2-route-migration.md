# Plan A2 – Route Migration: app/ → app/[lang]/

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all existing Next.js routes from `app/` to `app/[lang]/` to support next-intl locale routing. Add `useTranslations()` to all components for DE/FR/EN/IT support.

**Architecture:** next-intl `app/[lang]/` pattern as per Next.js 16 docs. Each layout/page gets a `params: Promise<{ lang: string }>` prop. Components get `useTranslations(namespace)`. No logic changes — only routing structure and string extraction.

**Prerequisite:** Plan A1 must be complete (next-intl installed, messages files exist, proxy.ts configured).

**Tech Stack:** next-intl (`useTranslations`, `getTranslations`), Next.js 16 `LayoutProps`/`PageProps` helpers

---

## File Map

All files under `app/` (except `app/api/`) move to `app/[lang]/`.

### Moved (same content + locale param added):
- `app/layout.tsx` → `app/[lang]/layout.tsx`
- `app/page.tsx` → `app/[lang]/page.tsx`
- `app/not-found.tsx` → `app/[lang]/not-found.tsx`
- `app/403/page.tsx` → `app/[lang]/403/page.tsx`
- `app/auth/**` → `app/[lang]/auth/**`
- `app/dashboard/**` → `app/[lang]/dashboard/**`
- `app/superadmin/**` → `app/[lang]/superadmin/**`
- `app/tenant/**` → `app/[lang]/tenant/**`

### Not moved (no locale needed):
- `app/api/**` — stays as-is (API routes don't need locale)
- `app/globals.css` — stays at root
- `app/favicon.ico` — stays at root

### Modified (add translations):
- All layout.tsx files — add `lang` param, pass to `<html lang>`
- All page.tsx files — strings extracted to messages files
- Components in `components/` — `useTranslations()` added for displayed strings

### New files:
- `app/[lang]/` directory structure
- `components/layout/LocaleSwitcher.tsx` — language selector component

---

## Migration Strategy

Move routes in this order to minimize breakage:
1. Root layout (must be first — wraps everything)
2. Auth routes (login, forgot-password, reset-password)
3. Dashboard routes (most used by vermieter)
4. Tenant routes
5. Superadmin routes
6. Components (translate strings)

After each group: verify build compiles and dev server starts.

---

## Task 1: Create app/[lang]/ Root Layout

**Files:**
- Create: `app/[lang]/layout.tsx`
- Modify: `app/layout.tsx` (keep as shell or delete)

- [ ] **Step 1: Read current app/layout.tsx**

Read `app/layout.tsx` to understand current root layout.

- [ ] **Step 2: Create app/[lang]/layout.tsx**

Create `app/[lang]/layout.tsx`:

```tsx
import type { LayoutProps } from 'next/types'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ lang: locale }))
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params

  if (!routing.locales.includes(lang as (typeof routing.locales)[number])) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={lang}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Update app/layout.tsx to be minimal redirect shell**

Replace `app/layout.tsx` with a minimal shell that redirects to default locale — only needed if someone accesses `/` directly without locale:

```tsx
// app/layout.tsx — Shell für Root ohne Locale
// next-intl proxy.ts kümmert sich um den Redirect zu /de
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage"
npx tsc --noEmit 2>&1 | grep -i "lang\|locale\|layout" | head -10
```

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/[lang]/layout.tsx
git commit -m "feat: create app/[lang]/layout.tsx for next-intl routing"
```

---

## Task 2: Migrate Auth Routes

**Files:**
- Move: `app/auth/` → `app/[lang]/auth/`
- Keep originals temporarily (delete after verification)

- [ ] **Step 1: Copy auth routes to [lang]/auth/**

```bash
cp -r "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/auth" \
      "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/[lang]/auth"
```

- [ ] **Step 2: Read app/[lang]/auth/login/page.tsx**

Read to understand current content.

- [ ] **Step 3: Update login page to use params and translations**

In `app/[lang]/auth/login/page.tsx`, add locale param support. The page receives `params: Promise<{ lang: string }>` via `PageProps`. Add `useTranslations` for the auth namespace.

For Server Components, use `getTranslations`:
```tsx
import { getTranslations } from 'next-intl/server'

export default async function LoginPage({ params }: PageProps<'/[lang]/auth/login'>) {
  const { lang } = await params
  const t = await getTranslations('auth')
  // ... rest of page using t('login'), t('email'), etc.
}
```

For Client Components (forms), the parent passes translations as props, or the component uses `useTranslations()` client-side.

- [ ] **Step 4: Delete old auth routes**

```bash
rm -rf "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/auth"
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/de/auth/login
kill %1
```

Expected: 200

- [ ] **Step 6: Commit**

```bash
git add app/[lang]/auth/ app/auth/
git commit -m "feat: migrate auth routes to app/[lang]/auth/"
```

---

## Task 3: Migrate 403 and Root Pages

**Files:**
- Move: `app/403/` → `app/[lang]/403/`
- Move: `app/page.tsx` → `app/[lang]/page.tsx`
- Move: `app/not-found.tsx` → `app/[lang]/not-found.tsx`

- [ ] **Step 1: Move pages**

```bash
mkdir -p "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/[lang]/403"
cp "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/403/page.tsx" \
   "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/[lang]/403/page.tsx"
cp "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/page.tsx" \
   "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/[lang]/page.tsx"
cp "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/not-found.tsx" \
   "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/[lang]/not-found.tsx" 2>/dev/null || true
```

- [ ] **Step 2: Delete originals**

```bash
rm -rf "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/403"
rm -f "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/page.tsx"
rm -f "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/not-found.tsx"
```

- [ ] **Step 3: Commit**

```bash
git add -A app/
git commit -m "feat: migrate 403 and root pages to app/[lang]/"
```

---

## Task 4: Migrate Dashboard Routes

This is the largest group — all files under `app/dashboard/` move to `app/[lang]/dashboard/`.

- [ ] **Step 1: Copy entire dashboard directory**

```bash
cp -r "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/dashboard" \
      "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/[lang]/dashboard"
```

- [ ] **Step 2: Update dashboard/layout.tsx for locale param**

Read `app/[lang]/dashboard/layout.tsx`. Update to use `LayoutProps<'/[lang]/dashboard'>` and extract `lang` from params for any locale-aware redirects.

The `redirect('/auth/login')` calls must be updated to `redirect(\`/${lang}/auth/login\`)`. Read the `lang` from params.

- [ ] **Step 3: Fix internal redirects throughout dashboard**

Search for all hardcoded redirect paths:

```bash
grep -r "redirect\('/\|redirect(\`/" "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/[lang]/dashboard/" | grep -v node_modules
```

For each redirect, prepend the locale: `redirect('/dashboard/...')` → `redirect(\`/${lang}/dashboard/...\`)`.

The `lang` param flows down from `layout.tsx` — Server Components can use `headers()` from next/headers to get locale, or receive it via `params`.

**Alternative:** Use next-intl's `redirect` helper instead of Next.js redirect:
```tsx
import { redirect } from '@/i18n/navigation'
// This automatically adds the locale prefix
redirect('/dashboard/...')
```

Create `i18n/navigation.ts`:
```ts
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
```

Then replace all `import { redirect } from 'next/navigation'` with `import { redirect } from '@/i18n/navigation'` in dashboard pages.

- [ ] **Step 4: Delete original dashboard directory**

```bash
rm -rf "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/dashboard"
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "dashboard" | head -20
```

Fix any type errors. Common issues: `PageProps`/`LayoutProps` needs locale segment.

- [ ] **Step 6: Commit**

```bash
git add -A app/
git add i18n/navigation.ts
git commit -m "feat: migrate dashboard routes to app/[lang]/dashboard/"
```

---

## Task 5: Migrate Tenant Routes

- [ ] **Step 1: Copy tenant directory**

```bash
cp -r "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/tenant" \
      "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/[lang]/tenant"
```

- [ ] **Step 2: Fix imports and redirects (same pattern as dashboard)**

Replace `import { redirect } from 'next/navigation'` with `import { redirect } from '@/i18n/navigation'` throughout.

- [ ] **Step 3: Delete original**

```bash
rm -rf "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/tenant"
```

- [ ] **Step 4: Commit**

```bash
git add -A app/
git commit -m "feat: migrate tenant routes to app/[lang]/tenant/"
```

---

## Task 6: Migrate Superadmin Routes

- [ ] **Step 1: Copy superadmin directory**

```bash
cp -r "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/superadmin" \
      "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/[lang]/superadmin"
```

- [ ] **Step 2: Fix imports and redirects**

Same pattern as dashboard — replace `next/navigation` imports with `@/i18n/navigation`.

- [ ] **Step 3: Delete original**

```bash
rm -rf "/Users/flavio/Documents/Projekte/Immobilienverwaltung V2/immo-manage/app/superadmin"
```

- [ ] **Step 4: Commit**

```bash
git add -A app/
git commit -m "feat: migrate superadmin routes to app/[lang]/superadmin/"
```

---

## Task 7: Create LocaleSwitcher Component

**Files:**
- Create: `components/layout/LocaleSwitcher.tsx`

- [ ] **Step 1: Create the component**

Create `components/layout/LocaleSwitcher.tsx`:

```tsx
'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

const localeLabels: Record<string, string> = {
  de: '🇩🇪 DE',
  fr: '🇫🇷 FR',
  en: '🇬🇧 EN',
  it: '🇮🇹 IT',
}

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      className="text-sm bg-transparent border border-border rounded px-2 py-1 cursor-pointer"
      aria-label="Sprache wählen"
    >
      {routing.locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeLabels[loc]}
        </option>
      ))}
    </select>
  )
}
```

- [ ] **Step 2: Add LocaleSwitcher to DashboardHeader**

Read `components/layout/DashboardHeader.tsx`. Add `<LocaleSwitcher />` to the header toolbar area (next to the notification bell or user menu).

- [ ] **Step 3: Add LocaleSwitcher to TenantSidebar**

Read `components/layout/TenantSidebar.tsx`. Add `<LocaleSwitcher />` at the bottom.

- [ ] **Step 4: Commit**

```bash
git add components/layout/LocaleSwitcher.tsx components/layout/DashboardHeader.tsx components/layout/TenantSidebar.tsx
git commit -m "feat: add LocaleSwitcher component to header and tenant sidebar"
```

---

## Task 8: Add Translations to Key Components

Priority components to translate (most visible strings):

- [ ] **Step 1: Translate DashboardSidebar**

Read `components/layout/DashboardSidebar.tsx`. Replace hardcoded nav label strings with `t('nav.dashboard')`, `t('nav.properties')`, etc.

Add `'use client'` if not present. Import `useTranslations`:
```tsx
import { useTranslations } from 'next-intl'
// ...
const t = useTranslations('nav')
// Replace: "Dashboard" → t('dashboard')
// Replace: "Objekte" → t('properties')
// etc.
```

- [ ] **Step 2: Translate EmptyState component**

Read `components/shared/EmptyState.tsx`. Replace hardcoded strings. These are usually passed as props — if already prop-driven, no change needed.

- [ ] **Step 3: Translate key page headings**

For each dashboard page.tsx, replace hardcoded `<h1>` strings with `getTranslations`:

```tsx
const t = await getTranslations('properties')
// <h1>{t('title')}</h1>  instead of <h1>Objekte</h1>
```

Priority pages:
- `app/[lang]/dashboard/page.tsx` — dashboard title and KPI labels
- `app/[lang]/dashboard/properties/page.tsx` — heading
- `app/[lang]/dashboard/tenants/page.tsx` — heading
- `app/[lang]/dashboard/payments/page.tsx` — (new, will be created in Plan B)

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/ app/[lang]/
git commit -m "feat: add useTranslations to sidebar and key page headings"
```

---

## Task 9: Verify Full App Works End-to-End

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Fix any remaining type errors.

- [ ] **Step 2: Start dev server**

```bash
npm run dev &
sleep 8
```

- [ ] **Step 3: Test locale routing**

```bash
# Root should redirect to /de
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
# Should be 307

# German route works
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/de/auth/login
# Should be 200

# French route works
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/fr/auth/login
# Should be 200
```

- [ ] **Step 4: Stop dev server**

```bash
kill %1 2>/dev/null || pkill -f "next dev"
```

- [ ] **Step 5: Final commit and tag**

```bash
npm test
git add -A
git commit -m "feat: complete next-intl route migration (app/[lang]/)"
git tag plan-a2-complete
```

---

## Summary

After Plan A2 is complete:
- ✅ All routes under `app/[lang]/`
- ✅ Locale routing via proxy.ts + next-intl
- ✅ LocaleSwitcher in header/sidebar
- ✅ Key components use `useTranslations()`
- ✅ All 4 languages (DE/FR/EN/IT) work

**Next:** Plan B — Zahlungsverwaltung (Sollstellung, QR-Rechnung, Mahnungen)
