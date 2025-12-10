"use client"

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
import { AddProductDialog } from "@/components/add-product-dialog"
import { EditProductDialog } from "@/components/edit-product-dialog"

// ================== SCHEMA PRODUK ==================

export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  category: z.string().nullable().optional(),
  default_sell_price: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Product = z.infer<typeof productSchema>

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

function TableCellViewer({ item }: { item: Product }) {
  const isMobile = useIsMobile()
  const categoryLabel = item.category ?? "-"
  const descriptionLabel = item.description ?? "-"
  // const price = new Intl.NumberFormat("id-ID", {
  //   style: "currency",
  //   currency: "IDR",
  //   maximumFractionDigits: 0,
  // }).format(Number(item.default_sell_price))

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground px-0 text-left">
          {item.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>{item.sku}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4 pb-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{categoryLabel }</Badge>
            <Badge variant={item.is_active ? "default" : "outline"}>
              {item.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>

          {/* <div className="font-bold text-lg">{price}</div> */}
            <>
              <Separator />
              <p>{descriptionLabel}</p>
            </>
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

function DraggableRow({ row }: { row: Row<Product> }) {
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

export function DataTableProduct({
  data: initialData,
  onRefresh,
}: {
  data: Product[]
  onRefresh?: () => void
}) {
  const [data, setData] = React.useState<Product[]>(initialData)

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

  // ================== KOLOM TABEL ==================
  const columns: ColumnDef<Product>[] = React.useMemo(
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
      {
        accessorKey: "name",
        header: "Produk",
        cell: ({ row }) => <TableCellViewer item={row.original} />,
      },
      // {
      //   accessorKey: "sku",
      //   header: "SKU",
      //   cell: ({ row }) => (
      //     <span className="font-mono text-xs">{row.original.sku}</span>
      //   ),
      // },
      {
        accessorKey: "category",
        header: "Kategori",
        cell: ({ row }) => (
          
          <Badge variant="outline" className="px-1.5">
            {row.original.category ?? "-"}
          </Badge>
        ),
      },
      // {
      //   accessorKey: "default_sell_price",
      //   header: () => <div className="text-right w-full">Harga Jual</div>,
      //   cell: ({ row }) => {
      //     const value = Number(row.original.default_sell_price)
      //     const formatted = new Intl.NumberFormat("id-ID", {
      //       style: "currency",
      //       currency: "IDR",
      //       maximumFractionDigits: 0,
      //     }).format(value)

      //     return <div className="text-right font-medium">{formatted}</div>
      //   },
      // },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => {
          const active = Boolean(row.original.is_active)
          return (
            <Badge
              variant={active ? "default" : "outline"}
              className={active ? "bg-emerald-500 text-white" : ""}
            >
              {active ? "Aktif" : "Nonaktif"}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const product = row.original

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
              <DropdownMenuContent align="end" className="w-40">
                <EditProductDialog product={product} onSuccess={onRefresh} />
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
    [onRefresh]
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
          <Label htmlFor="search-name" className="sr-only">
            Cari produk
          </Label>
          <Input
            id="search-name"
            placeholder="Cari produk..."
            className="h-8 w-full max-w-xs"
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
          />
        </div>
        <AddProductDialog onSuccess={onRefresh} />
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
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
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
