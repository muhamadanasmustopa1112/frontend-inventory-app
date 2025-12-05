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

type AddProductDialogProps = {
  onSuccess?: () => void
}

export function AddProductDialog({ onSuccess }: AddProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget 
    const formData = new FormData(e.currentTarget)

    const body = {
      name: formData.get("name"),
      sku: formData.get("sku"),
      default_sell_price: Number(formData.get("default_sell_price") || 0),
      category: formData.get("category"),
      description: formData.get("description"),
    }

    const loadingToastId = toast.loading("Menyimpan produk…")

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        let message = "Gagal menyimpan produk"
        try {
          const data = await res.json()
          if (data?.message) message = data.message
        } catch {}

        throw new Error(message)
      }

      toast.success("Berhasil menambahkan produk!", {
        id: loadingToastId,
      })
      form.reset()
      setOpen(false)
      onSuccess?.()

    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan produk!", {
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
          + Tambah Produk
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Produk</DialogTitle>
          <DialogDescription>
            Isi data produk baru lalu klik simpan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_sell_price">Harga Jual</Label>
            <Input
              id="default_sell_price"
              name="default_sell_price"
              type="number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Input id="category" name="category" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              name="description"
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
