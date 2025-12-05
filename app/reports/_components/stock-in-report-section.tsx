// app/reports/_components/stock-in-report-section.tsx
"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  StockInRow,
  StockInSummary,
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

export function StockInReportSection() {
  const user = useAuthStore((state) => state.user)
  const isWarehouseScoped = !!user?.warehouse_id
  const isAdmin = !isWarehouseScoped // admin pusat = tidak punya warehouse_id

  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [warehouseId, setWarehouseId] = React.useState("")
  const [perPage, setPerPage] = React.useState("20")

  const [page, setPage] = React.useState(1)

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<StockInRow[]>([])
  const [meta, setMeta] = React.useState<PaginationMeta | null>(null)
  const [summary, setSummary] = React.useState<StockInSummary | null>(null)

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

  async function fetchStockIn(targetPage?: number) {
    try {
      setLoading(true)
      setError(null)

      const pageToLoad = targetPage ?? page

      const qs = new URLSearchParams()
      if (dateFrom) qs.set("date_from", dateFrom)
      if (dateTo) qs.set("date_to", dateTo)
      // hanya admin pusat yang boleh kirim warehouse_id dari UI
      if (warehouseId && isAdmin) qs.set("warehouse_id", warehouseId)
      if (perPage) qs.set("per_page", perPage)
      qs.set("page", String(pageToLoad))

      const url = `/api/reports/stock-in?${qs.toString()}`

      const res = await fetch(url, { cache: "no-store" })
      const parsed = await parseApiListResponse<StockInRow, StockInSummary>(res)

      if (!parsed.ok) {
        setError(parsed.message ?? "Gagal mengambil data stock in")
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
    // admin pusat saja yang perlu list gudang
    if (isAdmin) {
      fetchWarehouses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  React.useEffect(() => {
    fetchStockIn(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleApplyFilters() {
    fetchStockIn(1)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Stock In</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ringkasan */}
        {summary && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm flex flex-wrap gap-4">
            <div>
              <span className="text-muted-foreground">Total transaksi:</span>{" "}
              <span className="font-semibold">
                {summary.total_transactions}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">
                Total unit (page):
              </span>{" "}
              <span className="font-semibold">
                {formatNumber(summary.total_units_in_page)}
              </span>
            </div>
          </div>
        )}

        {/* Filter */}
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

          {/* Filter Gudang:
              - Admin pusat: tampil Select Gudang
              - Staff/admin gudang: disembunyikan (API sudah kunci ke gudangnya sendiri)
          */}
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
                      loadingWarehouses
                        ? "Memuat gudang..."
                        : "Semua gudang"
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

        {/* Tabel */}
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-right">Total Item</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Tidak ada data
                  </TableCell>
                </TableRow>
              )}

              {rows.map((row) => {
                const totalQty = row.items?.reduce(
                  (sum, item) => sum + item.qty,
                  0
                )

                return (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.date_in)}</TableCell>
                    <TableCell>{row.warehouse?.name ?? "-"}</TableCell>
                    <TableCell>{row.reference}</TableCell>
                    <TableCell>{row.note ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(totalQty ?? 0)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between pt-3">
            <p className="text-xs text-muted-foreground">
              Halaman {meta.current_page} dari {meta.last_page} • Total{" "}
              {meta.total} transaksi
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => fetchStockIn(page - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.last_page || loading}
                onClick={() => fetchStockIn(page + 1)}
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
