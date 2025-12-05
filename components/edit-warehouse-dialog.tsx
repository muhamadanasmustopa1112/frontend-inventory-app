"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type { Warehouse } from "@/components/data-table-warehouse"
import { toast } from "sonner"


export function EditWarehouseDialog({
  warehouse,
  onSuccess,
}: {
  warehouse: Warehouse
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const body = {
      name: formData.get("name"),
      code: formData.get("code"),
      city: formData.get("city"),
      address: formData.get("address"),
    }

    const loadingToastId = toast.loading("Mengupdate gudang…")

    try {
        const res = await fetch(`/api/warehouses/${warehouse.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })

        if (!res.ok) {
            alert("Gagal mengedit gudang")
            return
        }

        toast.success("Berhasil mengupdate gudang!", {
            id: loadingToastId,
        })

        setOpen(false)
        onSuccess?.()

    } catch (error: any) {
        toast.error(error?.message || "Gagal mengupdate gudang!", {
            id: loadingToastId,
        })
    } finally {
        setLoading(false)
    }
    
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()} 
        >
          Edit
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent 
        onOpenAutoFocus={(e) => {
            e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Gudang</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Gudang</Label>
            <Input name="name" defaultValue={warehouse.name} required />
          </div>

          <div className="space-y-2">
            <Label>Kode</Label>
            <Input name="code" defaultValue={warehouse.code} required />
          </div>

          <div className="space-y-2">
            <Label>Kota</Label>
            <Input
              name="city"
              defaultValue={warehouse.city}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Alamat</Label>
            <Textarea
              name="address"
              defaultValue={warehouse.address ?? ""}
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
