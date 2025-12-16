"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { StockByWarehouseChart } from "./_components/stock-by-warehouse-chart"
import { TopProductsTable } from "./_components/top-products-table"
import { StockByProductChart } from "./_components/stock-by-product-chart"
import { StockOutByProductChart } from "./_components/stock-out-product-chart"

type DashboardData = {
  summary: {
    totalUnitsIn: number
    totalUnitsOut: number
    totalStockQty: number
  }
  stockByProduct: { product_name: string; qty: number }[]
  stockOutByProduct: { product_name: string; qty: number }[]
  stockByWarehouse: { warehouse: string; qty: number }[]
  topProducts: { product_id: number; product_name: string; qty: number }[]
}

export default function DashboardAnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchDashboard() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/dashboard", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.message || "Gagal mengambil data dashboard")
        setData(null)
      } else {
        // optional basic runtime sanity: ensure numeric values exist
        const safe: DashboardData = {
          summary: {
            totalUnitsIn: Number(json?.summary?.totalUnitsIn ?? 0),
            totalUnitsOut: Number(json?.summary?.totalUnitsOut ?? 0),
            totalStockQty: Number(json?.summary?.totalStockQty ?? 0),
          },
          stockByProduct: Array.isArray(json?.stockByProduct) ? json.stockByProduct : [],
          stockOutByProduct: Array.isArray(json?.stockOutByProduct) ? json.stockOutByProduct : [],
          stockByWarehouse: Array.isArray(json?.stockByWarehouse) ? json.stockByWarehouse : [],
          topProducts: Array.isArray(json?.topProducts) ? json.topProducts : [],
        }
        setData(safe)
      }
    } catch (err: any) {
      setError(err?.message ?? "Unexpected error")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

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
              <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 space-y-6">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Dashboard Analitik
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Ringkasan stok masuk, keluar, dan saldo berdasarkan data laporan.
                  </p>
                </div>

                {/* Loading / Error */}
                {loading && (
                  <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Memuat data dashboard...
                    </p>
                  </div>
                )}

                {error && !loading && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                {data && !loading && !error && (
                  <>
                    {/* Summary cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">
                            Total Stock Out (Unit)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {data.summary.totalUnitsOut.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total unit keluar (berdasarkan laporan stock out).
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">
                            Total Stock In (Unit)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {data.summary.totalUnitsIn.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total unit masuk (berdasarkan laporan).
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">
                            Total Stock Balance (Qty)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {data.summary.totalStockQty.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total qty saat ini berdasarkan laporan saldo stok.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">
                            Distribusi Stock per Nama Produk
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <StockByProductChart data={data.stockByProduct} />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">
                            Produk Terjual / Stock Out
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <StockOutByProductChart data={data.stockOutByProduct} />
                        </CardContent>
                      </Card>
                    </div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Stock per Warehouse
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <StockByWarehouseChart data={data.stockByWarehouse} />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Top Produk berdasarkan Qty Stock
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <TopProductsTable data={data.topProducts} />
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
