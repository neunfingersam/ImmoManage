// lib/excel-import.ts — Excel Import Parsing & Validierung

import { z } from 'zod'

const propertyTypeMap: Record<string, 'SINGLE' | 'MULTI'> = {
  MFH: 'MULTI',
  EFH: 'SINGLE',
  Gewerbe: 'SINGLE',
}

const propertySchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  address: z.string().min(1, 'Adresse ist erforderlich'),
  type: z.enum(['SINGLE', 'MULTI']),
  unitCount: z.number().int().positive(),
  year: z.number().int().optional(),
})

const tenantSchema = z.object({
  firstName: z.string().min(1, 'Vorname erforderlich'),
  lastName: z.string().min(1, 'Nachname erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().optional(),
  iban: z.string().optional(),
  propertyName: z.string().min(1, 'Objekt-Name erforderlich'),
  unitNumber: z.string().min(1, 'Einheit-Nr. erforderlich'),
  startDate: z.string().min(1, 'Mietbeginn erforderlich'),
  endDate: z.string().optional(),
  coldRent: z.number().positive('Kaltmiete muss positiv sein'),
  extraCosts: z.number().min(0),
})

type PropertyInput = Record<string, unknown>
type TenantInput = Record<string, unknown>

export function parsePropertyRow(row: PropertyInput) {
  const typeStr = String(row.type ?? '')
  const mappedType = propertyTypeMap[typeStr]

  if (!mappedType) {
    return { success: false as const, error: `Ungültiger Typ: ${typeStr}. Erlaubt: MFH, EFH, Gewerbe` }
  }

  const parsed = propertySchema.safeParse({ ...row, type: mappedType })
  if (!parsed.success) {
    const errors = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
    return { success: false as const, error: errors.join(', ') }
  }
  return { success: true as const, data: parsed.data }
}

export function parseTenantRow(row: TenantInput) {
  const parsed = tenantSchema.safeParse(row)
  if (!parsed.success) {
    const errors = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
    return { success: false as const, error: errors.join(', ') }
  }
  return { success: true as const, data: parsed.data }
}

export function validateImportData(data: { properties: TenantInput[]; tenants: TenantInput[] }): string[] {
  const errors: string[] = []

  // Doppelte E-Mails prüfen
  const emails = data.tenants.map((t) => String(t.email ?? '').toLowerCase())
  const seen = new Set<string>()
  for (const email of emails) {
    if (seen.has(email)) {
      errors.push(`E-Mail doppelt vorhanden: ${email}`)
    }
    seen.add(email)
  }

  return errors
}

/** Parst Datum im Format DD.MM.YYYY */
export function parseSwissDate(dateStr: string): Date | null {
  const parts = dateStr.trim().split('.')
  if (parts.length !== 3) return null
  const [day, month, year] = parts.map(Number)
  if (!day || !month || !year) return null
  return new Date(year, month - 1, day)
}
