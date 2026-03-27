import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCompany, toggleCompanyActive } from '../_actions'
import { PlanSelector } from './PlanSelector'
import { getPlanLimits, formatLimit } from '@/lib/plan-limits'
import { prisma } from '@/lib/prisma'

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', VERMIETER: 'Vermieter', MIETER: 'Mieter',
}

async function getUsage(companyId: string) {
  const [propertyCount, unitCount, userCount] = await Promise.all([
    prisma.property.count({ where: { companyId } }),
    prisma.unit.count({ where: { property: { companyId } } }),
    prisma.user.count({ where: { companyId, role: { in: ['ADMIN', 'VERMIETER'] } } }),
  ])
  return { propertyCount, unitCount, userCount }
}

function UsageBar({ used, max, label }: { used: number; max: number | null; label: string }) {
  const pct = max === null ? 0 : Math.min(100, Math.round((used / max) * 100))
  const isOver = max !== null && used > max
  const color = isOver ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={isOver ? 'text-red-500 font-semibold' : ''}>
          {used} / {formatLimit(max)}
        </span>
      </div>
      {max !== null && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  )
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [company, usage] = await Promise.all([getCompany(id), getUsage(id)])
  if (!company) notFound()

  const limits = getPlanLimits(company.plan)

  async function handleToggle() {
    'use server'
    await toggleCompanyActive(id)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button render={<Link href="/superadmin/companies" />} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />Zurück
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">{company.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Slug: {company.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={company.active ? 'default' : 'secondary'}>{company.active ? 'Aktiv' : 'Inaktiv'}</Badge>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: limits.color }}
          >
            {limits.label}
          </span>
          <form action={handleToggle}>
            <Button type="submit" variant="outline" size="sm">
              {company.active ? 'Deaktivieren' : 'Aktivieren'}
            </Button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Immobilien', value: company._count.properties },
          { label: 'Mietverträge', value: company._count.leases },
          { label: 'Tickets', value: company._count.tickets },
        ].map(s => (
          <Card key={s.label} className="p-3 sm:p-4 text-center">
            <p className="text-2xl font-serif text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Plan Management */}
      <Card className="p-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-0.5">Abo-Plan</h2>
          <p className="text-xs text-muted-foreground">Plan wechseln — Änderungen gelten sofort</p>
        </div>

        {/* Usage vs Limits */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aktuelle Nutzung</p>
          <UsageBar used={usage.propertyCount} max={limits.maxProperties} label="Objekte" />
          <UsageBar used={usage.unitCount} max={limits.maxUnits} label="Einheiten" />
          <UsageBar used={usage.userCount} max={limits.maxUsers} label="Benutzer (Admin + Vermieter)" />
          <div className="pt-1 grid grid-cols-3 gap-2 text-xs">
            {[
              { label: 'QR-Rechnung', ok: limits.features.qrInvoice },
              { label: 'Steuermappe', ok: limits.features.taxFolder },
              { label: 'KI-Assistent', ok: limits.features.aiAssistant },
            ].map(f => (
              <span
                key={f.label}
                className={`rounded-full px-2.5 py-1 text-center font-medium ${f.ok ? 'bg-green-50 text-green-700' : 'bg-muted text-muted-foreground line-through'}`}
              >
                {f.label}
              </span>
            ))}
          </div>
        </div>

        <PlanSelector companyId={company.id} currentPlan={company.plan} />
      </Card>

      {/* Users */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Nutzer ({company.users.length})</h2>
        {company.users.map(u => (
          <Card key={u.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{u.name}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{roleLabels[u.role] ?? u.role}</Badge>
              {!u.active && <Badge variant="secondary">Inaktiv</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
