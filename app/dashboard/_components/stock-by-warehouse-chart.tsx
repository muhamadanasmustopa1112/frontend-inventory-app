"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

type Props = {
  data: { warehouse: string; qty: number }[]
}

export function StockByWarehouseChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Belum ada data saldo stok untuk ditampilkan.
      </p>
    )
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="warehouse" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v: any) => Number(v).toLocaleString("id-ID")}
          />
          <Bar dataKey="qty" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
