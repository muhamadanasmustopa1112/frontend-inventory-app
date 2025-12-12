"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import JSZip from "jszip"
import { saveAs } from "file-saver"

export type ProductUnit = {
  id: number
  unit_code: string
  status: string
  product?: {
    name: string
    sku: string
  } | null
  warehouse?: {
    name: string
    city?: string | null
  } | null
}

export function DataTableProductUnits({
  data: initialData,
}: {
  data: ProductUnit[]
}) {
  const [data, setData] = React.useState<ProductUnit[]>(initialData)

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  // select states
  const [selectedProduct, setSelectedProduct] = React.useState<string | null>(
    null
  )
  const [selectedWarehouse, setSelectedWarehouse] =
    React.useState<string | null>(null)

  const [isGeneratingZip, setIsGeneratingZip] = React.useState(false)

  // table states
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const columns: ColumnDef<ProductUnit>[] = React.useMemo(
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
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "unit_code",
        header: "Kode Unit",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.unit_code}</span>
        ),
      },
      {
        id: "product",
        header: "Produk",
        accessorFn: (row) => row.product?.name ?? "",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="line-clamp-1">
              {row.original.product?.name ?? "-"}
            </span>
            {row.original.product?.sku && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {row.original.product.sku}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "warehouse",
        header: "Gudang",
        accessorFn: (row) => row.warehouse?.name ?? "",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.warehouse?.name ?? "-"}</span>
            {row.original.warehouse?.city && (
              <span className="text-xs text-muted-foreground">
                {row.original.warehouse.city}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status
          const isInStock = status === "IN_STOCK"
          return (
            <Badge
              variant={isInStock ? "default" : "outline"}
              className={
                isInStock ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
              }
            >
              {status}
            </Badge>
          )
        },
      },
      // actions column intentionally removed (per request)
    ],
    []
  )

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
  })

  // sync selects -> table filters
  React.useEffect(() => {
    // set empty string to clear filter when null/empty
    table.getColumn("product")?.setFilterValue(selectedProduct ?? "")
    table.getColumn("warehouse")?.setFilterValue(selectedWarehouse ?? "")
    // reset to first page when filter changes
    table.setPageIndex(0)
  }, [selectedProduct, selectedWarehouse, table])

  async function handleGenerateZip(filteredRows: ProductUnit[]) {
    if (filteredRows.length === 0) {
      alert("Tidak ada data untuk digenerate.")
      return
    }

    setIsGeneratingZip(true)
    const zip = new JSZip()
    let failed = 0

    try {
      for (const row of filteredRows) {
        try {
          const res = await fetch(
            `http://127.0.0.1:8000/qr/product-unit/${row.id}`,
            { method: "GET" }
          )

          if (!res.ok) {
            throw new Error(`Server responded ${res.status}`)
          }

          const blob = await res.blob()

          // try filename from content-disposition
          const disposition = res.headers.get("content-disposition") || ""
          let filenameMatch = disposition.match(
            /filename\*?=(?:UTF-8'')?"?([^";]+)/i
          )
          let filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : ""

          if (!filename) {
            const ct = (res.headers.get("content-type") || "").toLowerCase()
            const ext = ct.includes("png")
              ? "png"
              : ct.includes("svg")
              ? "svg"
              : ct.includes("pdf")
              ? "pdf"
              : ct.includes("jpeg") || ct.includes("jpg")
              ? "jpg"
              : "bin"
            filename = `${row.unit_code}.${ext}`
          }

          // use arrayBuffer for binary safety
          const arrayBuffer = await blob.arrayBuffer()
          zip.file(filename, arrayBuffer)
        } catch (err) {
          console.error(`Gagal download QR untuk id=${row.id}:`, err)
          failed += 1
          // continue
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      saveAs(zipBlob, "qr-product-units.zip")

      if (failed > 0) {
        alert(
          `Selesai, namun ${failed} file gagal diunduh dan tidak dimasukkan ke ZIP.`
        )
      } else {
        alert("Selesai: ZIP berhasil dibuat dan diunduh.")
      }
    } catch (err) {
      console.error("Gagal membuat ZIP:", err)
      alert("Terjadi error saat membuat ZIP.")
    } finally {
      setIsGeneratingZip(false)
    }
  }

  // sentinel value used for "all" options — must NOT be empty string
  const ALL_SENTINEL = "__all__"

  return (
    <div className="w-full flex flex-col gap-4 p-6">
      {/* Search */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Label htmlFor="search-units" className="sr-only">
            Cari unit / produk
          </Label>
          <Input
            id="search-units"
            placeholder="Cari kode unit atau nama produk…"
            className="h-8 w-full max-w-xs"
            value={
              (table.getColumn("unit_code")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("unit_code")?.setFilterValue(event.target.value)
            }
          />
        </div>
      </div>

      {/* Selects + Generate ZIP */}
      <div className="flex gap-2 mb-4 items-center">
        <Select
          value={selectedProduct ?? ALL_SENTINEL}
          onValueChange={(value) =>
            setSelectedProduct(value === ALL_SENTINEL ? null : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih produk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SENTINEL}>Semua produk</SelectItem>
            {Array.from(
              new Set(data.map((item) => item.product?.name).filter(Boolean))
            ).map((product) => (
              // ensure product name exists before rendering item
              <SelectItem key={product} value={product!}>
                {product}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedWarehouse ?? ALL_SENTINEL}
          onValueChange={(value) =>
            setSelectedWarehouse(value === ALL_SENTINEL ? null : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih gudang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SENTINEL}>Semua gudang</SelectItem>
            {Array.from(
              new Set(data.map((item) => item.warehouse?.name).filter(Boolean))
            ).map((warehouse) => (
              <SelectItem key={warehouse} value={warehouse!}>
                {warehouse}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => {
            // ambil rows yg sudah terfilter di table (menggabungkan semua filter)
            const filteredRows = table.getFilteredRowModel().rows.map(
              (r) => r.original
            )

            if (filteredRows.length === 0) {
              alert("Tidak ada data untuk digenerate.")
              return
            }

            handleGenerateZip(filteredRows)
          }}
          disabled={isGeneratingZip}
        >
          {isGeneratingZip ? "Generating ZIP..." : "Generate ZIP"}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
          {table.getFilteredSelectedRowModel().rows.length} dari{" "}
          {table.getFilteredRowModel().rows.length} baris dipilih.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Baris per halaman
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} dari{" "}
            {table.getPageCount() || 1}
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
