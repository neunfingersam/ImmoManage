'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts'

type RenewalItem = {
  restlebensdauer: number | null
  erneuerungskosten: number | null
  letzteErneuerung: number | null
}

type FondsChartProps = {
  fondsStand: number
  fondsBeitragssatz: number
  gebVersicherungswert: number
  renewalItems: RenewalItem[]
}

function fmt(n: number) {
  return new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(n)
}

export function FondsChart({ fondsStand, fondsBeitragssatz, gebVersicherungswert, renewalItems }: FondsChartProps) {
  const currentYear = new Date().getFullYear()
  const annualContribution = gebVersicherungswert * (fondsBeitragssatz / 100)

  const data: { year: number; fondsStand: number; erneuerung: number }[] = []
  let balance = fondsStand

  for (let i = 0; i <= 20; i++) {
    const year = currentYear + i
    const renewalCost = renewalItems
      .filter(r => {
        const base = r.letzteErneuerung ?? currentYear
        const due = base + (r.restlebensdauer ?? 0)
        return due === year
      })
      .reduce((s, r) => s + (r.erneuerungskosten ?? 0), 0)

    if (i > 0) balance = balance + annualContribution - renewalCost
    data.push({ year, fondsStand: Math.max(0, Math.round(balance)), erneuerung: Math.round(renewalCost) })
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => `${fmt(v / 1000)}k`} tick={{ fontSize: 12 }} width={70} />
        <Tooltip
          formatter={(value, name) => [
            `CHF ${fmt(Number(value))}`,
            name === 'fondsStand' ? 'Fondsstand' : 'Erneuerungskosten',
          ]}
          labelFormatter={(l) => `Jahr ${l}`}
        />
        <Legend
          formatter={(v) => v === 'fondsStand' ? 'Fondsstand' : 'Erneuerungskosten'}
        />
        <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
        <Line type="monotone" dataKey="fondsStand" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="erneuerung" stroke="hsl(var(--destructive))" strokeWidth={1} strokeDasharray="4 4" dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
