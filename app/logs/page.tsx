"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableLogs } from "@/components/data-table-logs";

type ActivityLog = {
  id: number;
  action: string;
  table_name: string | null;
  record_id: number | null;
  user_id: number | null;
  user_name?: string | null;
  before_data?: any;
  after_data?: any;
  description?: string | null;
  created_at: string;
};

export default function Page() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [perPage] = useState<number>(20);
  const [page] = useState<number>(1);

  async function fetchLogs() {
    try {
      setLoading(true);
      setError(null);

      const qs = new URLSearchParams({
        per_page: String(perPage),
        page: String(page),
      }).toString();

      const res = await fetch(`/api/logs?${qs}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || "Gagal mengambil data log");
        setLogs([]);
        return;
      }

      const payload = await res.json().catch(() => null);
      const data = payload?.data ?? payload ?? [];
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch logs:", e);
      setError("Terjadi kesalahan koneksi");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
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
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
            <p className="text-primary font-medium">Loading logs...</p>

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
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
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
          <div className="p-6">
            <p className="text-red-500">{error}</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
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
          <div className="@container/main flex flex-1 flex-col gap-2 p-4">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DataTableLogs data={logs} onRefresh={fetchLogs} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
