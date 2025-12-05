"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DataTableProductUnits } from "@/components/data-table-product-units"

export default function Page() {
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchUnits() {
    setLoading(true)

    try {
      const res = await fetch("/api/product-units")
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        setError(err?.message || "Gagal mengambil data")
        return
      }

      const data = await res.json()
      setUnits(data.data ?? [])
    } catch {
      setError("Kesalahan koneksi ke server")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <Loader2 className="animate-spin size-10 text-primary" />
    </div>
  )

  if (error) return <p className="text-red-500">{error}</p>

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <div className="p-6">
          <DataTableProductUnits
            data={units}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
