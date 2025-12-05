"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type AddWarehouseDialogProps = {
  onSuccess?: () => void
}

export function AddWarehouseDialog({ onSuccess }: AddWarehouseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget 
    const formData = new FormData(e.currentTarget)

    const body = {
      name: formData.get("name"),
      code: formData.get("code"),
      city: formData.get("city"),
      address: formData.get("address"),
    }

    const loadingToastId = toast.loading("Menyimpan gudang…")

    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        let message = "Gagal menyimpan gudang"
        try {
          const data = await res.json()
          if (data?.message) message = data.message
        } catch {}

        throw new Error(message)
      }

      toast.success("Berhasil menambahkan gudang!", {
        id: loadingToastId,
      })
      form.reset()
      setOpen(false)
      onSuccess?.()

    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan gudang!", {
        id: loadingToastId,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          + Tambah Gudang
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Gudang</DialogTitle>
          <DialogDescription>
            Isi data gudang baru lalu klik simpan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Gudang</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Kode</Label>
            <Input id="code" name="code" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Kota</Label>
            <Input
              id="city"
              name="city"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Deskripsikan produk..."
              className="min-h-[100px] resize-y"
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
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
