"use client"

import type React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SalesReportSection } from "./_components/sales-report-section"
import { StockInReportSection } from "./_components/stock-in-report-section"
import { StockBalanceReportSection } from "./_components/stock-balance-report-section"

export default function Page() {
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
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Laporan
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Laporan sales (stock out), stock in, dan saldo stok.
                  </p>
                </div>

                <Tabs defaultValue="sales" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="sales">Sales</TabsTrigger>
                    <TabsTrigger value="stock-in">Stock In</TabsTrigger>
                    <TabsTrigger value="stock-balance">
                      Stock Balance
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="sales">
                    <SalesReportSection />
                  </TabsContent>

                  <TabsContent value="stock-in">
                    <StockInReportSection />
                  </TabsContent>

                  <TabsContent value="stock-balance">
                    <StockBalanceReportSection />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
