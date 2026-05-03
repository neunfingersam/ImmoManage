'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Rectangle,
} from 'recharts'

export type MonthlyRevenue = {
  label: string
  amount: number
  isCurrent: boolean
}

function formatChf(value: number) {
  return `CHF ${value.toLocaleString('de-CH', { maximumFractionDigits: 0 })}`
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-primary font-bold">{formatChf(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function RevenueBarChart({ data }: { data: MonthlyRevenue[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 6 }} />
        <Bar
          dataKey="amount"
          radius={[6, 6, 0, 0]}
          activeBar={(props: any) => {
            const entry = data[props.index]
            const fill = entry.isCurrent ? '#c95e36' : 'rgba(232, 115, 74, 0.38)'
            return <Rectangle {...props} fill={fill} radius={[6, 6, 0, 0]} />
          }}
        >
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.isCurrent ? '#E8734A' : 'rgba(232, 115, 74, 0.22)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
