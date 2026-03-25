// lib/activity.ts — Aktivitätsprotokoll Hilfsfunktionen

import { prisma } from '@/lib/prisma'

type ActivityAction =
  | 'TENANT_CREATED'
  | 'TENANT_DELETED'
  | 'PAYMENT_RECORDED'
  | 'RENT_DEMANDS_GENERATED'
  | 'REMINDER_SENT'
  | 'DOCUMENT_UPLOADED'
  | 'LEASE_CREATED'
  | 'LEASE_ENDED'
  | 'TICKET_CREATED'
  | 'TICKET_RESOLVED'
  | 'EXCEL_IMPORT'
  | 'HANDOVER_WIZARD_STEP_1'
  | 'HANDOVER_WIZARD_STEP_2'
  | 'HANDOVER_WIZARD_STEP_3'
  | 'HANDOVER_WIZARD_STEP_4'
  | 'HANDOVER_WIZARD_STEP_5'
  | string

const actionLabels: Record<string, (meta: Record<string, unknown>) => string> = {
  TENANT_CREATED: (m) => `Mieter angelegt: ${m.tenantName ?? ''}`,
  TENANT_DELETED: (m) => `Mieter gelöscht: ${m.tenantName ?? ''}`,
  PAYMENT_RECORDED: (m) => `Zahlung erfasst: CHF ${m.amount ?? ''}`,
  RENT_DEMANDS_GENERATED: (m) => `${m.created ?? 0} Sollstellungen generiert`,
  REMINDER_SENT: (m) => `Mahnung Stufe ${m.level ?? ''} gesendet`,
  DOCUMENT_UPLOADED: (m) => `Dokument hochgeladen: ${m.name ?? ''}`,
  LEASE_CREATED: () => `Mietvertrag erstellt`,
  LEASE_ENDED: () => `Mietvertrag beendet`,
  TICKET_CREATED: (m) => `Schadensmeldung erstellt: ${m.title ?? ''}`,
  TICKET_RESOLVED: () => `Schadensmeldung erledigt`,
  EXCEL_IMPORT: (m) => `Import: ${m.propertiesCreated ?? 0} Objekte, ${m.tenantsCreated ?? 0} Mieter`,
  HANDOVER_WIZARD_STEP_1: () => 'Mieterwechsel: Schritt 1 (Kündigung)',
  HANDOVER_WIZARD_STEP_2: () => 'Mieterwechsel: Schritt 2 (Nachmieter)',
  HANDOVER_WIZARD_STEP_3: () => 'Mieterwechsel: Schritt 3 (Übergabe)',
  HANDOVER_WIZARD_STEP_4: () => 'Mieterwechsel: Schritt 4 (Kaution)',
  HANDOVER_WIZARD_STEP_5: () => 'Mieterwechsel: Schritt 5 (Neuer Mieter)',
}

/** Formatiert eine Aktion als lesbaren String */
export function formatActivityAction(
  action: ActivityAction,
  meta: Record<string, unknown>
): string {
  const fn = actionLabels[action]
  if (fn) return fn(meta)
  return action.replace(/_/g, ' ').toLowerCase()
}

/** Schreibt einen ActivityLog-Eintrag */
export async function logActivity(params: {
  companyId: string
  userId: string
  action: ActivityAction
  entity: string
  entityId?: string
  meta?: Record<string, unknown>
}) {
  return prisma.activityLog.create({
    data: {
      companyId: params.companyId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      meta: params.meta ?? {},
    },
  })
}
