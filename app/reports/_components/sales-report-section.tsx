// app/reports/_components/sales-report-section.tsx
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
  SalesRow,
  SalesSummary,
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

export function SalesReportSection() {
  const user = useAuthStore((state) => state.user)
  const isWarehouseScoped = !!user?.warehouse_id
  const isAdmin = !isWarehouseScoped // admin pusat = tidak punya warehouse_id

  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [warehouseId, setWarehouseId] = React.useState("")
  const [buyerId, setBuyerId] = React.useState("")
  const [perPage, setPerPage] = React.useState("20")

  const [page, setPage] = React.useState(1)

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<SalesRow[]>([])
  const [meta, setMeta] = React.useState<PaginationMeta | null>(null)
  const [summary, setSummary] = React.useState<SalesSummary | null>(null)

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

  async function fetchSales(targetPage?: number) {
    try {
      setLoading(true)
      setError(null)

      const pageToLoad = targetPage ?? page

      const qs = new URLSearchParams()
      if (dateFrom) qs.set("date_from", dateFrom)
      if (dateTo) qs.set("date_to", dateTo)
      if (warehouseId && isAdmin) qs.set("warehouse_id", warehouseId)
      if (buyerId) qs.set("buyer_id", buyerId)
      if (perPage) qs.set("per_page", perPage)
      qs.set("page", String(pageToLoad))

      const url = `/api/reports/sales?${qs.toString()}`

      const res = await fetch(url, { cache: "no-store" })
      const parsed = await parseApiListResponse<SalesRow, SalesSummary>(res)

      if (!parsed.ok) {
        setError(parsed.message ?? "Gagal mengambil data sales")
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
    fetchSales(1)
  }, [])

  function handleApplyFilters() {
    fetchSales(1)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Sales (Stock Out)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm flex flex-wrap gap-4">
            <div>
              <span className="text-muted-foreground">Total Revenue:</span>{" "}
              <span className="font-semibold">
                Rp {formatNumber(summary.total_revenue)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Periode:</span>{" "}
              <span>
                {summary.date_from || summary.date_to
                  ? `${summary.date_from ?? "?"} s/d ${summary.date_to ?? "?"}`
                  : "Semua tanggal"}
              </span>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-1">
            <Label htmlFor="sales-date-from">Tanggal dari</Label>
            <Input
              id="sales-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sales-date-to">Tanggal sampai</Label>
            <Input
              id="sales-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

   
          {isAdmin && (
            <div className="space-y-1">
              <Label htmlFor="sales-warehouse-id">Gudang</Label>
              <Select
                value={warehouseId}
                onValueChange={(val) => setWarehouseId(val)}
              >
                <SelectTrigger id="sales-warehouse-id">
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
            <Label htmlFor="sales-buyer-id">Buyer ID</Label>
            <Input
              id="sales-buyer-id"
              placeholder="opsional"
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sales-per-page">Per page</Label>
            <Input
              id="sales-per-page"
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
                <TableHead>Buyer</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-right">Total Price</TableHead>
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

              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.date_out)}</TableCell>
                  <TableCell>{row.warehouse?.name ?? "-"}</TableCell>
                  <TableCell>{row.buyer?.name ?? "-"}</TableCell>
                  <TableCell>{row.note ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    Rp {formatNumber(row.total_price)}
                  </TableCell>
                </TableRow>
              ))}
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
                onClick={() => fetchSales(page - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.last_page || loading}
                onClick={() => fetchSales(page + 1)}
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
