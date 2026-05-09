import type { Plan } from '@/lib/generated/prisma'

export interface PlanLimits {
  maxProperties: number | null  // null = unlimited
  maxUnits: number | null
  maxUsers: number | null       // counts ADMIN + VERMIETER
  features: {
    qrInvoice: boolean
    taxFolder: boolean
    aiAssistant: boolean
  }
  label: string
  price: string
  color: string
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  STARTER: {
    maxProperties: 2,
    maxUnits: 10,
    maxUsers: 1,
    features: { qrInvoice: false, taxFolder: false, aiAssistant: false },
    label: 'Starter',
    price: 'CHF 29/Mt.',
    color: '#94a3b8',
  },
  STANDARD: {
    maxProperties: 8,
    maxUnits: 40,
    maxUsers: 2,
    features: { qrInvoice: true, taxFolder: true, aiAssistant: false },
    label: 'Standard',
    price: 'CHF 69/Mt.',
    color: '#3b82f6',
  },
  PRO: {
    maxProperties: 20,
    maxUnits: 150,
    maxUsers: 5,
    features: { qrInvoice: true, taxFolder: true, aiAssistant: true },
    label: 'Pro',
    price: 'CHF 129/Mt.',
    color: '#E8734A',
  },
  ENTERPRISE: {
    maxProperties: null,
    maxUnits: null,
    maxUsers: null,
    features: { qrInvoice: true, taxFolder: true, aiAssistant: true },
    label: 'Enterprise',
    price: 'Auf Anfrage',
    color: '#8b5cf6',
  },
}

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan]
}

export function formatLimit(value: number | null): string {
  return value === null ? '∞' : String(value)
}
