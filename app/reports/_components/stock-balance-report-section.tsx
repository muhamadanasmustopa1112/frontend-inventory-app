// app/reports/_components/stock-balance-report-section.tsx
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
  StockBalanceRow,
  StockBalanceSummary,
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

function formatNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "-"
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return "-"
  return num.toLocaleString("id-ID")
}

export function StockBalanceReportSection() {
  const user = useAuthStore((state) => state.user)
  const isWarehouseScoped = !!user?.warehouse_id
  const isAdmin = !isWarehouseScoped // admin pusat = tidak punya warehouse_id

  const [warehouseId, setWarehouseId] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [perPage, setPerPage] = React.useState("20")

  const [page, setPage] = React.useState(1)

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<StockBalanceRow[]>([])
  const [meta, setMeta] = React.useState<PaginationMeta | null>(null)
  const [summary, setSummary] = React.useState<StockBalanceSummary | null>(null)

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

  async function fetchStockBalance(targetPage?: number) {
    try {
      setLoading(true)
      setError(null)

      const pageToLoad = targetPage ?? page

      const qs = new URLSearchParams()
      // hanya admin pusat yang boleh kirim warehouse_id dari UI
      if (warehouseId && isAdmin) qs.set("warehouse_id", warehouseId)
      if (category) qs.set("category", category)
      if (search) qs.set("search", search)
      if (perPage) qs.set("per_page", perPage)
      qs.set("page", String(pageToLoad))

      const url = `/api/reports/stock-balance?${qs.toString()}`

      const res = await fetch(url, { cache: "no-store" })
      const parsed = await parseApiListResponse<
        StockBalanceRow,
        StockBalanceSummary
      >(res)

      if (!parsed.ok) {
        setError(parsed.message ?? "Gagal mengambil data stock balance")
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
    fetchStockBalance(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleApplyFilters() {
    fetchStockBalance(1)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Stock Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {summary && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm flex flex-wrap gap-4">
            <div>
              <span className="text-muted-foreground">Total produk:</span>{" "}
              <span className="font-semibold">{summary.total_rows}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total qty:</span>{" "}
              <span className="font-semibold">
                {formatNumber(summary.total_qty)}
              </span>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Gudang: hanya admin pusat yang bisa pilih */}
          {isAdmin && (
            <div className="space-y-1">
              <Label htmlFor="sb-warehouse-id">Gudang</Label>
              <Select
                value={warehouseId}
                onValueChange={(val) => setWarehouseId(val)}
              >
                <SelectTrigger id="sb-warehouse-id">
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
            <Label htmlFor="sb-category">Kategori</Label>
            <Input
              id="sb-category"
              placeholder="Splicer / Tangga"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sb-search">Cari produk</Label>
            <Input
              id="sb-search"
              placeholder="nama / SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sb-per-page">Per page</Label>
            <Input
              id="sb-per-page"
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
                <TableHead>Produk</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Kota</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Tidak ada data
                  </TableCell>
                </TableRow>
              )}

              {rows.map((row) => (
                <TableRow key={`${row.product_id}-${row.warehouse_id}`}>
                  <TableCell>{row.product_name}</TableCell>
                  <TableCell>{row.sku}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.warehouse_name}</TableCell>
                  <TableCell>{row.warehouse_city}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(row.qty)}
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
              {meta.total} baris
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => fetchStockBalance(page - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.last_page || loading}
                onClick={() => fetchStockBalance(page + 1)}
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
