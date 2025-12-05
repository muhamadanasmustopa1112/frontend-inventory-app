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
import type { Product } from "@/components/data-table-product"
import { toast } from "sonner"


export function EditProductDialog({
  product,
  onSuccess,
}: {
  product: Product
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
      sku: formData.get("sku"),
      default_sell_price: Number(formData.get("default_sell_price") || 0),
      category: formData.get("category"),
      description: formData.get("description"),
    }

    const loadingToastId = toast.loading("Mengupdate produk…")

    try {
        const res = await fetch(`/api/products/${product.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })

        if (!res.ok) {
            alert("Gagal mengedit produk")
            return
        }

        toast.success("Berhasil mengupdate produk!", {
            id: loadingToastId,
        })

        setOpen(false)
        onSuccess?.()

    } catch (error: any) {
        toast.error(error?.message || "Gagal mengupdate produk!", {
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
          <DialogTitle>Edit Produk</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Produk</Label>
            <Input name="name" defaultValue={product.name} required />
          </div>

          <div className="space-y-2">
            <Label>SKU</Label>
            <Input name="sku" defaultValue={product.sku} required />
          </div>

          <div className="space-y-2">
            <Label>Harga Jual</Label>
            <Input
              name="default_sell_price"
              type="number"
              defaultValue={product.default_sell_price}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Input name="category" defaultValue={product.category} />
          </div>

          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea
              name="description"
              defaultValue={product.description ?? ""}
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
