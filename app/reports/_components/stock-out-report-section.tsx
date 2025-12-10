"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  StockOutRow,
  StockOutSummary,
  PaginationMeta,
  parseApiListResponse,
} from "./report-types"
import { useAuthStore } from "@/stores/useAuthStore"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

function formatDate(value: string) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("id-ID")
}

function formatNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "-"
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return "-"
  return num.toLocaleString("id-ID")
}

export default function StockOutReportSection() {
  const user = useAuthStore((state) => state.user)
  const isWarehouseScoped = !!user?.warehouse_id
  const isAdmin = !isWarehouseScoped 

  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [warehouseId, setWarehouseId] = React.useState("")
  const [perPage, setPerPage] = React.useState("20")

  const [page, setPage] = React.useState(1)

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<StockOutRow[]>([])
  const [meta, setMeta] = React.useState<PaginationMeta | null>(null)
  const [summary, setSummary] = React.useState<StockOutSummary | null>(null)

  const [warehouses, setWarehouses] = React.useState<any[]>([])
  const [loadingWarehouses, setLoadingWarehouses] = React.useState(false)

  async function fetchWarehouses() {
    try {
      setLoadingWarehouses(true)
      const res = await fetch("/api/warehouses", { cache: "no-store" })
      const json = await res.json()
      setWarehouses(json?.data ?? json)
    } catch (err) {
      console.error("Gagal mengambil warehouse", err)
    } finally {
      setLoadingWarehouses(false)
    }
  }

  async function fetchStockOut(targetPage?: number) {
    try {
      setLoading(true)
      setError(null)

      const pageToLoad = targetPage ?? page

      const qs = new URLSearchParams()
      if (dateFrom) qs.set("date_from", dateFrom)
      if (dateTo) qs.set("date_to", dateTo)
      if (warehouseId && isAdmin) qs.set("warehouse_id", warehouseId)
      if (perPage) qs.set("per_page", perPage)
      qs.set("page", String(pageToLoad))

      const url = `/api/reports/stock-out?${qs.toString()}`

      const res = await fetch(url, { cache: "no-store" })
      const parsed = await parseApiListResponse<StockOutRow, StockOutSummary>(res)

      if (!parsed.ok) {
        setError(parsed.message ?? "Gagal mengambil data stock out")
        setRows([])
        setMeta(null)
        setSummary(null)
      } else {
        setRows(parsed.rows)
        setMeta(parsed.meta)
        setSummary(parsed.summary)
        setPage(pageToLoad)
      }
    } catch (err: any) {
      setError(err?.message ?? "Unexpected error")
      setRows([])
      setMeta(null)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (isAdmin) {
      fetchWarehouses()
    }
  }, [isAdmin])

  React.useEffect(() => {
    fetchStockOut(1)
  }, [])

  function handleApplyFilters() {
    fetchStockOut(1)
  }

  const chartData = React.useMemo(() => {
    if (!rows || rows.length === 0) return []

    const map = new Map<string, number>()

    for (const r of rows) {
      const key = formatDate(r.date_out)
      const totalQty = r.items?.reduce((s, it) => s + (it.qty ?? 0), 0) ?? 0
      map.set(key, (map.get(key) ?? 0) + totalQty)
    }

    const arr = Array.from(map.entries()).map(([label, value]) => ({ label, value }))

    arr.sort((a, b) => {
      const da = new Date(a.label)
      const db = new Date(b.label)
      return da.getTime() - db.getTime()
    })

    return arr
  }, [rows])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Stock Out (Chart)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm flex flex-wrap gap-4">
            <div>
              <span className="text-muted-foreground">Total transaksi:</span>{" "}
              <span className="font-semibold">{summary.total_transactions}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total unit (page):</span>{" "}
              <span className="font-semibold">
                {formatNumber(summary.total_units_in_page)}
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="si-date-from">Tanggal dari</Label>
            <Input
              id="si-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="si-date-to">Tanggal sampai</Label>
            <Input
              id="si-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {isAdmin && (
            <div className="space-y-1">
              <Label htmlFor="si-warehouse-id">Gudang</Label>
              <Select
                value={warehouseId}
                onValueChange={(val) => setWarehouseId(val)}
              >
                <SelectTrigger id="si-warehouse-id">
                  <SelectValue
                    placeholder={
                      loadingWarehouses ? "Memuat gudang..." : "Semua gudang"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={String(wh.id)}>
                      {wh.name} — {wh.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="si-per-page">Per page</Label>
            <Input
              id="si-per-page"
              type="number"
              min={1}
              value={perPage}
              onChange={(e) => setPerPage(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleApplyFilters} disabled={loading}>
            {loading ? "Memuat..." : "Terapkan Filter"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Chart area */}
        <div className="border rounded-md p-4 h-80">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Tidak ada data untuk ditampilkan di chart
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip formatter={(val: any) => formatNumber(val)} />
                <Bar dataKey="value" name="Total Unit" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between pt-3">
            <p className="text-xs text-muted-foreground">
              Halaman {meta.current_page} dari {meta.last_page} • Total {meta.total} transaksi
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => fetchStockOut(page - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.last_page || loading}
                onClick={() => fetchStockOut(page + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
