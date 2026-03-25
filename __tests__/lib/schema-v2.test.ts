// __tests__/lib/schema-v2.test.ts
// Tests for v2 schema extensions: new enums and i18n message completeness
import { describe, it, expect } from 'vitest'
import deMessages from '../../messages/de.json'
import frMessages from '../../messages/fr.json'
import enMessages from '../../messages/en.json'
import itMessages from '../../messages/it.json'

// ─── Enum value tests ───────────────────────────────────────────────────────

describe('UnitStatus enum values', () => {
  const values = ['VERMIETET', 'LEER', 'RENOVIERUNG']
  it.each(values)('has value %s', (v) => {
    expect(v).toMatch(/^[A-Z_]+$/)
  })
})

describe('DepositStatus enum values', () => {
  const values = ['AUSSTEHEND', 'HINTERLEGT', 'FREIGEGEBEN']
  it.each(values)('has value %s', (v) => {
    expect(v).toMatch(/^[A-Z_]+$/)
  })
})

describe('RentDemandStatus enum values', () => {
  const values = ['PENDING', 'PAID', 'OVERDUE']
  it.each(values)('has value %s', (v) => {
    expect(v).toMatch(/^[A-Z_]+$/)
  })
})

describe('TaskType enum values', () => {
  const values = ['WARTUNG', 'REPARATUR', 'VERTRAGSVERLAENGERUNG', 'BESICHTIGUNG', 'SONSTIGES']
  it.each(values)('has value %s', (v) => {
    expect(v).toMatch(/^[A-Z_]+$/)
  })
})

describe('TaskStatus enum values', () => {
  const values = ['OFFEN', 'IN_BEARBEITUNG', 'ERLEDIGT']
  it.each(values)('has value %s', (v) => {
    expect(v).toMatch(/^[A-Z_]+$/)
  })
})

// ─── i18n message completeness ──────────────────────────────────────────────

// Collect all leaf key paths from a nested object
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, val]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      return collectKeys(val as Record<string, unknown>, path)
    }
    return [path]
  })
}

const locales = { de: deMessages, fr: frMessages, en: enMessages, it: itMessages }
const deKeys = new Set(collectKeys(deMessages as Record<string, unknown>))

describe('i18n messages: all locales have same keys as DE', () => {
  for (const [locale, messages] of Object.entries(locales)) {
    if (locale === 'de') continue
    const keys = new Set(collectKeys(messages as Record<string, unknown>))
    it(`${locale} has no missing keys`, () => {
      const missing = [...deKeys].filter((k) => !keys.has(k))
      expect(missing).toEqual([])
    })
    it(`${locale} has no extra keys`, () => {
      const extra = [...keys].filter((k) => !deKeys.has(k))
      expect(extra).toEqual([])
    })
  }
})

describe('i18n messages: required namespaces exist', () => {
  const requiredNamespaces = [
    'common', 'nav', 'dashboard', 'properties', 'units',
    'tenants', 'leases', 'payments', 'billing', 'documents',
    'templates', 'tasks', 'handoverWizard', 'onboarding', 'activity', 'auth', 'errors',
  ]

  for (const [locale, messages] of Object.entries(locales)) {
    it.each(requiredNamespaces)(`${locale} has namespace %s`, (ns) => {
      expect(messages).toHaveProperty(ns)
    })
  }
})
