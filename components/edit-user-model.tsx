"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import type { UserRow } from "./users-table"
import { toast } from "sonner"

type Props = {
  user: UserRow
  onClose: () => void
  onSaved?: () => void
}

type WarehouseOption = {
  id: number
  name: string
  city?: string | null
}

export default function EditUserModal({ user, onClose, onSaved }: Props) {
  const [open, setOpen] = useState(true)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState(user.role)
  const [warehouseId, setWarehouseId] = useState<number | null>(
    user.warehouse_id ?? null
  )

  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchWarehouses() {
      try {
        const res = await fetch(`/api/warehouses`, { cache: "no-store" })
        const payload = await res.json().catch(() => null)
        if (!mounted) return

        if (!res.ok) {
          console.error("Failed fetching warehouses", payload)
          setWarehouses([])
          return
        }

        const list = Array.isArray(payload) ? payload : payload?.data ?? []
        setWarehouses(list)
      } catch (err) {
        console.error("Error fetching warehouses:", err)
      }
    }
    fetchWarehouses()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    setName(user.name)
    setEmail(user.email)
    setRole(user.role)
    setWarehouseId(user.warehouse_id ?? null)
    setErrors({})
    setGeneralError(null)
  }, [user])

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault?.()
    setErrors({})
    setGeneralError(null)
    setLoading(true)

    const loadingToastId = toast.loading("Menyimpan perubahan…")

    try {
      const payload = {
        name,
        email,
        role,
        warehouse_id: role === "WAREHOUSE" ? warehouseId : null,
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (res.status === 422 && data?.errors) {
          setErrors(data.errors)
        } else {
          setGeneralError(data?.message || "Gagal memperbarui user")
        }
        toast.error(data?.message || "Gagal memperbarui user", { id: loadingToastId })
        setLoading(false)
        return
      }

      toast.success("User berhasil diperbarui", { id: loadingToastId })
      onSaved?.()
      setOpen(false)
    } catch (err: any) {
      console.error("Error updating user:", err)
      setGeneralError(err?.message ?? "Terjadi kesalahan")
      toast.error(err?.message ?? "Terjadi kesalahan", { id: loadingToastId })
    } finally {
      setLoading(false)
    }
  }

  function close() {
    setOpen(false)
    setTimeout(onClose, 200)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) close(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nama</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <p className="text-sm text-rose-600">{errors.name.join(", ")}</p>}
          </div>

          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.email && <p className="text-sm text-rose-600">{errors.email.join(", ")}</p>}
          </div>

          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v)}>
              <SelectTrigger aria-label="Pilih role">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="WAREHOUSE">WAREHOUSE</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-rose-600">{errors.role.join(", ")}</p>}
          </div>

          <div>
            <Label>Gudang (jika role WAREHOUSE)</Label>
            <Select
              value={warehouseId !== null ? String(warehouseId) : "none"}
              onValueChange={(v) => setWarehouseId(v === "none" ? null : Number(v))}
            >
              <SelectTrigger aria-label="Pilih gudang">
                <SelectValue placeholder="Pilih gudang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Tidak dipilih —</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name} {w.city ? `— ${w.city}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.warehouse_id && <p className="text-sm text-rose-600">{errors.warehouse_id.join(", ")}</p>}
          </div>

          {generalError && <p className="text-sm text-rose-600">{generalError}</p>}

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={close} type="button" disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
