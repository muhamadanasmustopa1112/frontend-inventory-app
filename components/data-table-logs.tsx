"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconRefresh,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LogDetailModal from "./log-detail-modal";
import { Loader2 } from "lucide-react";

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

export function DataTableLogs({
  data: initialData,
  onRefresh,
}: {
  data: ActivityLog[];
  onRefresh?: () => void;
}) {
  const [data, setData] = React.useState<ActivityLog[]>(initialData ?? []);
  React.useEffect(() => setData(initialData ?? []), [initialData]);

  // table state
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  // UI state
  const [search, setSearch] = React.useState("");
  const [selectedLog, setSelectedLog] = React.useState<ActivityLog | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // columns (NO TableCellViewer; plain cells only)
  const columns = React.useMemo<ColumnDef<ActivityLog>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(v) => row.toggleSelected(!!v)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "created_at",
        header: "Waktu",
        cell: ({ getValue }) => {
          const v = getValue() as string;
          return new Date(v).toLocaleString("id-ID");
        },
      },
      {
        accessorKey: "table_name",
        header: "Table",
        cell: ({ getValue }) => (getValue() as string) ?? "-",
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
      },
      {
        accessorKey: "record_id",
        header: "Record",
        cell: ({ getValue }) => (getValue() ?? "-"),
      },
      {
        accessorKey: "user_name",
        header: "User",
        cell: ({ row }) => row.original.user_name ?? row.original.user_id ?? "-",
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ getValue }) => (getValue() as string) ?? "-",
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedLog(log);
                  setShowDetail(true);
                }}
              >
                View
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <IconDotsVertical />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onSelect={() => navigator.clipboard?.writeText(JSON.stringify(log))}>
                    Copy JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onRefresh && onRefresh()}>
                    Refresh
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onRefresh]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // simple client-side search (applies to table_name / action / description)
  React.useEffect(() => {
    if (!search) {
      setData(initialData ?? []);
      return;
    }
    const q = search.toLowerCase();
    setData(
      (initialData ?? []).filter(
        (r) =>
          String(r.table_name ?? "").toLowerCase().includes(q) ||
          String(r.action ?? "").toLowerCase().includes(q) ||
          String(r.description ?? "").toLowerCase().includes(q)
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, initialData]);

  // refresh handler example (calls prop or triggers re-fetch upstream)
  async function handleRefresh() {
    setLoading(true);
    try {
      await onRefresh?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col gap-4 p-6">
      {/* Toolbar */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Label htmlFor="search-logs" className="sr-only">Cari logs</Label>
          <Input
            id="search-logs"
            placeholder="Cari table, action, atau description..."
            className="h-8 w-full max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger size="sm" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50].map((s) => (
                <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleRefresh} className="flex items-center gap-2">
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <IconRefresh />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} dari {table.getFilteredRowModel().rows.length} baris dipilih.
        </div>

        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">Baris per halaman</Label>
          </div>

          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} dari {table.getPageCount() || 1}
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>

            <Button variant="outline" className="size-8" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>

            <Button variant="outline" className="size-8" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>

            <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>

      {showDetail && selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setShowDetail(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
}
