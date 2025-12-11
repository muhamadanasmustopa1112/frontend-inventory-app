"use client"

import { useState } from "react"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import EditUserModal from "./edit-user-model"

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
  onRefresh?: () => void // callback untuk refresh list setelah edit sukses
}

export function UsersTable({
  data,
  loading,
  meta,
  page,
  onPageChange,
  onRefresh,
}: UsersTableProps) {
  const [editing, setEditing] = useState<UserRow | null>(null)

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
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && !loading && (
              <TableRow>
                <TableCell
                  colSpan={5}
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
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(user)}
                    >
                      Edit
                    </Button>
                  </div>
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

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            onRefresh?.()
          }}
        />
      )}
    </div>
  )
}

export default UsersTable
