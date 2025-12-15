"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { Loader2 } from "lucide-react"
import { z } from "zod"
import { toast } from "sonner"

import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import {
  DataTableStockOut,
  stockOutSchema,
  type StockOut,
} from "@/components/data-table-stock-out"

export default function Page() {
  const [stockOuts, setStockOuts] = useState<StockOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  /* ================= FETCH TABLE ================= */

  async function fetchStockOut() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/stock-out", {
        method: "GET",
        cache: "no-store",
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        setError(err?.message || "Gagal mengambil data stock out")
        return
      }

      const json = await res.json()
      const rawRows = json.data ?? json
      const parsed = z.array(stockOutSchema).safeParse(rawRows)

      if (!parsed.success) {
        console.error(parsed.error)
        setError("Format data stock out tidak sesuai")
        setStockOuts([])
      } else {
        setStockOuts(parsed.data)
      }
    } catch (err) {
      console.error(err)
      setError("Terjadi kesalahan koneksi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStockOut()
  }, [])

  /* ================= SCAN QR ================= */

  async function handleScanCode(code: string) {
    try {
      const res = await fetch("/api/scan-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(json?.message || "QR tidak valid / unit tidak ditemukan")
        return
      }

      const unit = json?.unit

      toast.success(
        unit
          ? `Unit tersedia: ${unit.product?.name ?? "-"} @ ${unit.warehouse?.name ?? "-"}`
          : "Unit tersedia"
      )
    } catch (err) {
      console.error(err)
      toast.error("Gagal menghubungi server")
    }
  }

  /* ================= CSV HELPER ================= */

  function toCsvValue(value: unknown) {
    if (value === null || value === undefined) return ""
    const str = String(value)
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }


  async function handleExportExcel() {
    try {
      if (!dateFrom || !dateTo) {
        toast.error("Tanggal awal dan akhir wajib diisi")
        return
      }

      toast.loading("Menyiapkan file export...", { id: "export" })

      const params = new URLSearchParams({
        date_from: dateFrom,
        date_to: dateTo,
      })

      const res = await fetch(
        `/api/reports/stock-out/export-units?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || "Gagal mengambil data laporan")
      }

      const json = await res.json()

      if (!json?.data || json.data.length === 0) {
        toast.error("Data laporan kosong", { id: "export" })
        return
      }

      const data = json.data as Record<string, any>[]
      const header = Object.keys(data[0])

      const rows = data.map((row) =>
        header.map((key) => toCsvValue(row[key]))
      )

      const csv = [
        header.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n")

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")

      a.href = url
      a.download = `laporan-stock-out-${dateFrom}-to-${dateTo}.csv`
      a.click()

      URL.revokeObjectURL(url)
      toast.success("Export berhasil", { id: "export" })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Export gagal", { id: "export" })
    }
  }


  /* ================= UI ================= */

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <p className="text-primary font-medium">Loading...</p>

        <div className="w-full max-w-4xl space-y-3 mt-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-16 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 flex-1 rounded-md" />
              <Skeleton className="h-10 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    )

  if (error)
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-red-500 text-sm font-medium">{error}</p>
      </div>
    )

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DataTableStockOut
                data={stockOuts}
                onRefresh={fetchStockOut}
                onScanCode={handleScanCode}
                onExportExcel={handleExportExcel}
                dateFrom={dateFrom}
                dateTo={dateTo}
                setDateFrom={setDateFrom}
                setDateTo={setDateTo}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
