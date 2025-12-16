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
            label={(entry) =>
              `${entry.product_name} (${entry.qty.toLocaleString("id-ID")})`
            }
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

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
