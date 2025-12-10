"use client"

import * as React from "react"
import {
  IconBarcode,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconInnerShadowTop,
  IconListDetails,
  IconLogs,
  IconPackageExport,
  IconPackageImport,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavStock } from "./nav-stock"
import { NavReports } from "./nav-report"
import { useAuthStore } from "@/stores/useAuthStore" 

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Master Barang",
      url: "/product",
      icon: IconListDetails,
    },
    {
      title: "Master Gudang",
      url: "/warehouse",
      icon: IconChartBar,
    },
    {
      title: "Master Pembeli",
      url: "/customer",
      icon: IconUsersGroup,
    },
    {
      title: "Team",
      url: "/team",
      icon: IconUsers,
    },
  ],
  navStock: [
    {
      title: "Stock Masuk",
      url: "/stock-in",
      icon: IconPackageImport,
    },
    {
      title: "Stock Keluar",
      url: "/stock-out",
      icon: IconPackageExport,
    },
    {
      title: "Daftar Unit Produk",
      url: "/product-units",
      icon: IconBarcode,
    },
  ],
  navReport: [
    {
      title: "Laporan",
      url: "/reports",
      icon: IconDatabase,
    },
    {
      title: "Log Aktivitas",
      url: "/logs",
      icon: IconLogs,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((state) => state.user)
  const isWarehouseScoped = !!user?.warehouse_id 
  const isAdmin = !isWarehouseScoped

  const navMain = isAdmin
    ? data.navMain
    : data.navMain.filter(
        (menu) => menu.title === "Dashboard" || menu.title === "Master Pembeli"
      )

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">My Inventory</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavStock items={data.navStock} />
        <NavReports items={data.navReport} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
