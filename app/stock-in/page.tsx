"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DataTableStockIn, stockInSchema, type StockIn } from "@/components/data-table-stock-in"
import z from "zod"

export default function Page() {
  const [stockIns, setStockIns] = useState<StockIn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchStockIn() {
    try {
      const res = await fetch("/api/stock-in", {
        method: "GET",
        cache: "no-store",
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        setError(err?.message || "Gagal mengambil data stock in")
        setLoading(false)
        return
      }

      const json = await res.json()
      const rawRows = json.data ?? json
      setStockIns(rawRows)
    } catch (error) {
      setError("Terjadi kesalahan koneksi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStockIn() 
  }, [])

  useEffect(() => {
    fetchStockIn()
  }, [])

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

  if (error) return <p className="text-red-500">{error}</p>

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
              <DataTableStockIn data={stockIns} onRefresh={fetchStockIn} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
