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
import { Button } from "@/components/ui/button"

import {
  DataTableStockOut,
  stockOutSchema,
  type StockOut,
} from "@/components/data-table-stock-out"

export default function Page() {
  const [stockOuts, setStockOuts] = useState<StockOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        setLoading(false)
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
    } catch (error) {
      console.error(error)
      setError("Terjadi kesalahan koneksi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStockOut()
  }, [])

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
          : "Unit is available"
      )

    } catch (err) {
      console.error(err)
      toast.error("Gagal menghubungi server")
    }
  }

    function toCsvValue(value: unknown) {
    if (value === null || value === undefined) return ""
    const str = String(value)
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  function handleExportExcel() {
    if (!stockOuts.length) {
      toast.error("Tidak ada data untuk diexport")
      return
    }

    const header = [
      "ID",
      "Tanggal",
      "Warehouse",
      "Buyer",
      "Invoice",
      "Catatan",
      "Total Price",
    ]

    const rowsCsv = stockOuts.map((row) => [
      toCsvValue(row.id),
      toCsvValue(row.date_out),
      toCsvValue(row.warehouse?.name ?? ""),
      toCsvValue(row.buyer?.name ?? ""),
      toCsvValue(row.reference ?? ""),
      toCsvValue(row.note ?? ""),
      toCsvValue(row.total_price ?? 0),
    ])

    const csvLines = [
      header.join(","),
      ...rowsCsv.map((r) => r.join(",")),
    ]

    const csv = csvLines.join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const today = new Date().toISOString().slice(0, 10)

    a.href = url
    a.download = `stock-out-${today}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }


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
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
