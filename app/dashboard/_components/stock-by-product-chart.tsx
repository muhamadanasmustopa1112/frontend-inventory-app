"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#ec4899", "#6366f1"]

type Props = {
  data: { product_name: string; qty: number }[]
}

export function StockByProductChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Belum ada data saldo stok produk untuk ditampilkan.
      </p>
    )
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="qty"
            nameKey="product_name"
            cx="50%"
            cy="50%"
            outerRadius={80}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip
            formatter={(value: any) =>
              Number(value).toLocaleString("id-ID")
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
