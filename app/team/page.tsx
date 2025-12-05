"use client"

import { useEffect, useState } from "react"
import type React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

import {
  UsersTable,
  type UserRow,
  type PaginationMeta,
} from "@/components/users-table"
import { AddUserDialog } from "@/components/add-user-dialog"

export default function TeamPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchUsers(targetPage?: number) {
    try {
      setLoading(true)
      setError(null)

      const pageToLoad = targetPage ?? page

      const qs = new URLSearchParams()
      qs.set("page", String(pageToLoad))
      qs.set("per_page", "20")

      const res = await fetch(`/api/users?${qs.toString()}`, {
        cache: "no-store",
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        setError(json?.message || "Gagal mengambil data user")
        setUsers([])
        setMeta(null)
        return
      }

      // Laravel paginate: { data: [...], meta: {...} }
      const rows: UserRow[] = json?.data ?? json
      const metaData: PaginationMeta | null = json?.meta ?? null

      setUsers(rows)
      setMeta(metaData)
      setPage(pageToLoad)
    } catch (err: any) {
      setError(err?.message ?? "Terjadi kesalahan")
      setUsers([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handlePageChange(nextPage: number) {
    fetchUsers(nextPage)
  }

  // state loading pertama kali → tampilkan skeleton seperti halaman lain
  if (loading && !users.length && !error) {
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
            <p className="text-primary font-medium">
              Memuat data user…
            </p>

            <div className="w-full max-w-4xl space-y-3 mt-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-24 rounded-md" />
                  <Skeleton className="h-10 w-48 rounded-md" />
                  <Skeleton className="h-10 flex-1 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

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
            <div className="@container/main flex flex-1 flex-col gap-2 px-2 md:px-6">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 max-w-6xl mx-auto w-full">
                <div className="flex items-center justify-between">
                    <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                        Team
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Kelola user, admin gudang, dan operator gudang.
                    </p>
                    </div>
                    <AddUserDialog onSuccess={() => fetchUsers(page)} />
                </div>

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}

                <UsersTable
                    data={users}
                    loading={loading}
                    meta={meta}
                    page={page}
                    onPageChange={handlePageChange}
                />
                </div>
            </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
