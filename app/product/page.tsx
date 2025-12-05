"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { DataTableProduct } from "@/components/data-table-product"
import { useEffect, useState } from "react"

export default function Page() {

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  async function fetchProducts() {

    try {
      const res = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        setError(err?.message || "Gagal mengambil data")
        setLoading(false)
        return
      }

      const data = await res.json()
      console.log(data);
      setProducts(data?.data ?? data)
    } catch (error) {
      setError("Terjadi kesalahan koneksi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  if (loading) return (
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
              <DataTableProduct data={products} onRefresh={fetchProducts} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
