"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"]

type Props = {
  data: { product_name: string; qty: number }[]
}

export function StockOutByProductChart({ data }: Props) {
  const filtered = data?.filter(d => d.qty > 0) ?? []

  if (filtered.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Belum ada produk yang keluar.
      </p>
    )
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="qty"
            nameKey="product_name"
            outerRadius={90}
          >
            {filtered.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => v.toLocaleString("id-ID")} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
