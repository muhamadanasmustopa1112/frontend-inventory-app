// app/dashboard/analytics/_components/top-products-table.tsx
"use client"

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

type Props = {
  data: { product_id: number; product_name: string; qty: number }[]
}

export function TopProductsTable({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Belum ada data produk untuk ditampilkan.
      </p>
    )
  }

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Produk</TableHead>
            <TableHead className="text-right">Qty Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.product_id}>
              <TableCell>{row.product_id}</TableCell>
              <TableCell>{row.product_name}</TableCell>
              <TableCell className="text-right">
                {row.qty.toLocaleString("id-ID")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
