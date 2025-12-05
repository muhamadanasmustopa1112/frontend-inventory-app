"use client"

import JSZip from "jszip"
import QRCode from "qrcode"
import { toast } from "sonner"
import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
} from "@tabler/icons-react"
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
} from "@tanstack/react-table"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AddStockInDialog } from "./add-stockin-dialog"

// ================== SCHEMA STOCK IN ==================

const warehouseSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
})

const productSchema = z.object({
  id: z.number(),
  sku: z.string(),
  name: z.string(),
  default_sell_price: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
})

const stockInItemSchema = z.object({
  id: z.number(),
  stock_in_id: z.number(),
  product_id: z.number(),
  qty: z.number(),
  sell_price: z.string(),
  buy_price: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  product: productSchema,
})

export const stockInSchema = z.object({
  id: z.number(),
  warehouse_id: z.number(),
  date_in: z.string(),
  reference: z.string().nullable(),
  note: z.string().nullable(),
  created_by: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  warehouse: warehouseSchema,
  items: z.array(stockInItemSchema),
})

export type StockIn = z.infer<typeof stockInSchema>

// ================== DRAG HANDLE ==================

type DragHandleProps = {
  attributes: React.HTMLAttributes<HTMLButtonElement>
  listeners: Record<string, any> | undefined
}

function DragHandle({ attributes, listeners }: DragHandleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent cursor-grab"
      type="button"
      tabIndex={-1}
      {...attributes}
      {...listeners}
    >
      <IconGripVertical className="size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// ================== DETAIL DRAWER ==================

function StockInCellViewer({ item }: { item: StockIn }) {
  const isMobile = useIsMobile()

  const dt = new Date(item.date_in)
  const totalQty = item.items.reduce((sum, it) => sum + it.qty, 0)

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground px-0 text-left">
          {item.reference || `Stock In #${item.id}`}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.reference || `Transaksi #${item.id}`}</DrawerTitle>
          <DrawerDescription>
            {item.warehouse?.name} •{" "}
            {dt.toLocaleDateString("id-ID")}{" "}
            {dt.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4 pb-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              Gudang: {item.warehouse?.name}
            </Badge>
            {item.warehouse?.city && (
              <Badge variant="outline">{item.warehouse.city}</Badge>
            )}
            <Badge variant="outline">Total Qty: {totalQty}</Badge>
          </div>

          {item.note && (
            <>
              <Separator />
              <div>
                <div className="font-medium mb-1">Catatan</div>
                <p>{item.note}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="font-medium">Item</div>
            <div className="space-y-1 max-h-56 overflow-auto pr-2">
              {item.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between text-xs border-b pb-1 last:border-0"
                >
                  <div className="flex flex-col">
                    <span>{it.product?.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {it.product?.sku}
                    </span>
                  </div>
                  <div className="text-right">
                    <div>Qty: {it.qty}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Jual:{" "}
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(Number(it.sell_price))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground">
            Dibuat: {new Date(item.created_at).toLocaleString("id-ID")}
            <br />
            Diupdate: {new Date(item.updated_at).toLocaleString("id-ID")}
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Tutup</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

// ================== DRAGGABLE ROW ==================

function DraggableRow({ row }: { row: Row<StockIn> }) {
  const { transform, transition, setNodeRef, isDragging, attributes, listeners } =
    useSortable({
      id: row.original.id,
    })

  return (
    <TableRow
      ref={setNodeRef}
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => {
        if (cell.column.id === "drag") {
          return (
            <TableCell key={cell.id}>
              <DragHandle
                attributes={attributes as any}
                listeners={listeners as any}
              />
            </TableCell>
          )
        }

        return (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )
}

// ================== MAIN COMPONENT ==================

export function DataTableStockIn({
  data: initialData,
  onRefresh,
}: {
  data: StockIn[],
  onRefresh?: () => void
}) {
  const [data, setData] = React.useState<StockIn[]>(initialData)

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

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

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data.map(({ id }) => id),
    [data]
  )
  

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!active || !over || active.id === over.id) return

    setData((items) => {
      const oldIndex = dataIds.indexOf(active.id)
      const newIndex = dataIds.indexOf(over.id)

      if (oldIndex === -1 || newIndex === -1) return items
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  async function handleDownloadQR(stockIn: StockIn) {
    try {
      if (!stockIn.items?.length) {
        toast.error("Tidak ada item dalam transaksi ini.")
        return
      }

      const zip = new JSZip()

      for (const item of stockIn.items) {
        const productName = item.product?.name || "Produk"
        const sku = item.product?.sku || "SKU"
        const totalQty = item.qty

        for (let i = 1; i <= totalQty; i++) {
          // teks yang dimasukkan ke QR
          const qrText = `${sku}-${String(i).padStart(3, "0")}`

          // generate QR jadi dataURL (base64 PNG)
          const dataUrl = await QRCode.toDataURL(qrText, {
            margin: 1,
            width: 400,
          })

          const base64 = dataUrl.split(",")[1]

          // nama file di ZIP, misal: TGR001-001.png
          const fileName = `${qrText}.png`

          zip.file(fileName, base64, { base64: true })
        }
      }

      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `QR-StockIn-${stockIn.id}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("QR berhasil didownload sebagai ZIP")
    } catch (err) {
      console.error(err)
      toast.error("Gagal membuat file QR")
    }
  }

  // ================== KOLOM TABEL ==================
  const columns: ColumnDef<StockIn>[] = React.useMemo(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: () => null,
        enableSorting: false,
        enableHiding: false,
      },
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

      // ==== Kolom transaksi (drawer detail) ====
      {
        id: "ref",
        header: "Transaksi",
        cell: ({ row }) => <StockInCellViewer item={row.original} />,
      },

      // ==== Kolom produk (nama produk + summary) ====
      {
        id: "products",
        header: "Produk",
        accessorFn: (row) =>
          row.items.map((it) => it.product?.name || "").join(", "),
        cell: ({ row }) => {
          const items = row.original.items || []
          if (!items.length) return <span>-</span>

          const first = items[0]
          const name = first.product?.name || "-"
          const count = items.length

          return (
            <div className="flex flex-col">
              <span className="line-clamp-1">{name}</span>
              {count > 1 && (
                <span className="text-xs text-muted-foreground">
                  + {count - 1} item lainnya
                </span>
              )}
            </div>
          )
        },
      },

      {
        accessorKey: "date_in",
        header: "Tanggal",
        cell: ({ row }) => {
          const dt = new Date(row.original.date_in)
          return (
            <div className="flex flex-col">
              <span>{dt.toLocaleDateString("id-ID")}</span>
              <span className="text-xs text-muted-foreground">
                {dt.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "warehouse.name",
        header: "Gudang",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.warehouse?.name}</span>
            {row.original.warehouse?.city && (
              <span className="text-xs text-muted-foreground">
                {row.original.warehouse.city}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "total_items",
        header: "Jml Item",
        cell: ({ row }) => row.original.items.length,
      },
      {
        id: "total_qty",
        header: "Total Qty",
        cell: ({ row }) =>
          row.original.items.reduce((sum, item) => sum + item.qty, 0),
      },
      {
        accessorKey: "note",
        header: "Catatan",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-xs text-xs">
            {row.original.note ?? "-"}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const stockIn = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                  size="icon"
                >
                  <IconDotsVertical />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                    onClick={() => handleDownloadQR(stockIn)}
                    >
                    Download QR (Semua Unit)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
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

  return (
    <div className="w-full flex flex-col gap-4 p-6">
      {/* Search & Add Button */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Label htmlFor="search-products" className="sr-only">
            Cari transaksi / produk
          </Label>
          <Input
            id="search-products"
            placeholder="Cari nama produk..."
            className="h-8 w-full max-w-xs"
            value={(table.getColumn("products")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("products")?.setFilterValue(event.target.value)
            }
          />
        </div>
       <AddStockInDialog onSuccess={onRefresh} />
      </div>

      {/* Tabel + Drag & Drop */}
      <div className="overflow-hidden rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
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
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Tidak ada data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
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
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
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
              onClick={() =>
                table.setPageIndex(table.getPageCount() - 1)
              }
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
