"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

export function RevenueTrendChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(v:number)=>`Rp ${v.toLocaleString("id-ID")}`}/>
        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2}/>
      </LineChart>
    </ResponsiveContainer>
  )
}
