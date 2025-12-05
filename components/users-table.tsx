"use client"

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export type UserRow = {
  id: number
  name: string
  email: string
  role: string
  warehouse_id: number | null
  warehouse?: {
    id: number
    name: string
    city?: string | null
  } | null
}

export type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

type UsersTableProps = {
  data: UserRow[]
  loading: boolean
  meta: PaginationMeta | null
  page: number
  onPageChange: (page: number) => void
}

export function UsersTable({
  data,
  loading,
  meta,
  page,
  onPageChange,
}: UsersTableProps) {
  return (
    <div className="space-y-3">
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Gudang</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && !loading && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-sm text-muted-foreground"
                >
                  Tidak ada data
                </TableCell>
              </TableRow>
            )}

            {data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {user.warehouse
                    ? `${user.warehouse.name}${
                        user.warehouse.city ? ` — ${user.warehouse.city}` : ""
                      }`
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Halaman {meta.current_page} dari {meta.last_page} • Total{" "}
            {meta.total} user
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.last_page || loading}
              onClick={() => onPageChange(page + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
