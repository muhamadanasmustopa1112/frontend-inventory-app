// components/team/add-user-dialog.tsx
"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

type AddUserDialogProps = {
  onSuccess?: () => void
}

type Warehouse = {
  id: number
  name: string
  city?: string | null
}

type LaravelErrorResponse = {
  message?: string
  errors?: Record<string, string[]>
}

export function AddUserDialog({ onSuccess }: AddUserDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [role, setRole] = React.useState<"ADMIN" | "WAREHOUSE" | "">("")
  const [warehouseId, setWarehouseId] = React.useState("")
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])
  const [loadingWh, setLoadingWh] = React.useState(false)

  const isWarehouseRole = role === "WAREHOUSE"

  async function fetchWarehouses() {
    try {
      setLoadingWh(true)
      const res = await fetch("/api/warehouses", { cache: "no-store" })
      const json = await res.json()
      setWarehouses(json?.data ?? json)
    } catch (err) {
      console.error("Gagal mengambil warehouse", err)
    } finally {
      setLoadingWh(false)
    }
  }

  React.useEffect(() => {
    if (open) {
      fetchWarehouses()
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!role) {
      toast.error("Role wajib dipilih")
      return
    }

    if (isWarehouseRole && !warehouseId) {
      toast.error("Pilih gudang untuk user WAREHOUSE")
      return
    }

    setLoading(true)
    const loadingId = toast.loading("Menyimpan user…")

    const payload: any = {
      name,
      email,
      password,
      role, // kirim "ADMIN" / "WAREHOUSE" sesuai backend
    }

    if (isWarehouseRole) {
      payload.warehouse_id = Number(warehouseId)
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await res.json().catch(() => null)) as
        | LaravelErrorResponse
        | null

      if (!res.ok) {
        let msg = data?.message || "Gagal menyimpan user"

        if (data?.errors) {
          const allErrors = Object.values(data.errors) // string[][]
          const first = allErrors[0]
          if (first && first[0]) {
            msg = first[0]
          }
        }

        throw new Error(msg)
      }

      toast.success("User berhasil ditambahkan", { id: loadingId })

      // reset form
      setName("")
      setEmail("")
      setPassword("")
      setRole("")
      setWarehouseId("")
      setOpen(false)

      onSuccess?.()
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal menyimpan user", {
        id: loadingId,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Tambah User</Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah User / Admin Gudang</DialogTitle>
          <DialogDescription>
            Isi data user untuk memberikan akses ke sistem inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Nama</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nama lengkap"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@inventory.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-password">Password</Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimal 8 karakter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-role">Role</Label>
            <Select
              value={role}
              onValueChange={(val) =>
                setRole(val as "ADMIN" | "WAREHOUSE")
              }
            >
              <SelectTrigger id="user-role">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">ADMIN (pusat)</SelectItem>
                <SelectItem value="WAREHOUSE">
                  WAREHOUSE (admin / operator gudang)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isWarehouseRole && (
            <div className="space-y-2">
              <Label htmlFor="user-warehouse">Gudang</Label>
              <Select
                value={warehouseId}
                onValueChange={(val) => setWarehouseId(val)}
              >
                <SelectTrigger id="user-warehouse">
                  <SelectValue
                    placeholder={
                      loadingWh ? "Memuat gudang..." : "Pilih gudang"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={String(wh.id)}>
                      {wh.name}
                      {wh.city ? ` — ${wh.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
