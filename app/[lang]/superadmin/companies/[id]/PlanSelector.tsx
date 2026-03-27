'use client'

import { useState, useTransition } from 'react'
import type { Plan } from '@/lib/generated/prisma'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import { updateCompanyPlan } from '../_actions'
import { Button } from '@/components/ui/button'

const plans: Plan[] = ['STARTER', 'STANDARD', 'PRO', 'ENTERPRISE']

interface PlanSelectorProps {
  companyId: string
  currentPlan: Plan
}

export function PlanSelector({ companyId, currentPlan }: PlanSelectorProps) {
  const [selected, setSelected] = useState<Plan>(currentPlan)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSave() {
    if (selected === currentPlan) return
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await updateCompanyPlan(companyId, selected)
      if (res.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(res.error ?? 'Fehler')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {plans.map((plan) => {
          const limits = PLAN_LIMITS[plan]
          const isSelected = selected === plan
          return (
            <button
              key={plan}
              onClick={() => setSelected(plan)}
              className="rounded-xl border-2 p-4 text-left transition-all"
              style={{
                borderColor: isSelected ? limits.color : '#e2e8f0',
                backgroundColor: isSelected ? `${limits.color}12` : '#fff',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: limits.color }}
                />
                <span className="font-semibold text-sm text-foreground">{limits.label}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-3">{limits.price}</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>
                  {limits.maxProperties === null ? '∞' : limits.maxProperties} Objekte
                </li>
                <li>
                  {limits.maxUnits === null ? '∞' : limits.maxUnits} Einheiten
                </li>
                <li>
                  {limits.maxUsers === null ? '∞' : limits.maxUsers} Benutzer
                </li>
                <li className={limits.features.qrInvoice ? 'text-green-600' : 'line-through opacity-40'}>
                  QR-Rechnung
                </li>
                <li className={limits.features.taxFolder ? 'text-green-600' : 'line-through opacity-40'}>
                  Steuermappe
                </li>
                <li className={limits.features.aiAssistant ? 'text-green-600' : 'line-through opacity-40'}>
                  KI-Assistent
                </li>
              </ul>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={selected === currentPlan || isPending}
          size="sm"
          className="bg-primary hover:bg-primary/90"
        >
          {isPending ? 'Speichern...' : 'Plan speichern'}
        </Button>
        {success && <p className="text-sm text-green-600 font-medium">Plan aktualisiert</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {selected !== currentPlan && (
          <p className="text-xs text-muted-foreground">
            Wechsel von <strong>{PLAN_LIMITS[currentPlan].label}</strong> zu <strong>{PLAN_LIMITS[selected].label}</strong>
          </p>
        )}
      </div>
    </div>
  )
}
