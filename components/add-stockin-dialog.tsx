"use client"

import { useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuthStore } from "@/stores/useAuthStore"

type AddStockInDialogProps = {
  onSuccess?: () => void
}

type ItemRow = {
  product_id: string
  qty: string
  sell_price: string
  buy_price: string
}

export function AddStockInDialog({ onSuccess }: AddStockInDialogProps) {
  const user = useAuthStore((state) => state.user)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [warehouseId, setWarehouseId] = useState<string>("")

  const [items, setItems] = useState<ItemRow[]>([
    { product_id: "", qty: "", sell_price: "", buy_price: "" },
  ])

  async function fetchWarehouses() {
    try {
      const res = await fetch("/api/warehouses", { cache: "no-store" })
      const json = await res.json()
      setWarehouses(json?.data ?? json)
    } catch (err) {
      console.error("Gagal mengambil warehouse", err)
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products", { cache: "no-store" })
      const json = await res.json()
      setProducts(json?.data ?? json)
    } catch (err) {
      console.error("Gagal mengambil produk", err)
    }
  }

  useEffect(() => {
    fetchWarehouses()
    fetchProducts()
  }, [])

  // kalau user punya warehouse_id (staff gudang), set otomatis
  useEffect(() => {
    if (user?.warehouse_id) {
      setWarehouseId(String(user.warehouse_id))
    }
  }, [user])

  function addItemRow() {
    setItems((prev) => [
      ...prev,
      { product_id: "", qty: "", sell_price: "", buy_price: "" },
    ])
  }

  function removeItemRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItemRow(
    index: number,
    field: keyof ItemRow,
    value: string
  ) {
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    // kalau user punya warehouse_id → pakai itu, kalau tidak baru pakai state select
    const warehouse_id = user?.warehouse_id ?? Number(warehouseId)

    if (!warehouse_id) {
      toast.error("Silakan pilih gudang dulu")
      setLoading(false)
      return
    }

    const date_in = formData.get("date_in") as string | null
    const reference = formData.get("reference") as string | null
    const note = formData.get("note") as string | null

    const cleanedItems = items
      .map((row) => ({
        product_id: Number(row.product_id || 0),
        qty: Number(row.qty || 0),
        sell_price: Number(
          String(row.sell_price || "0").replace(".", "").replace(",", ".")
        ),
        buy_price:
          row.buy_price === ""
            ? null
            : Number(
                String(row.buy_price || "0")
                  .replace(".", "")
                  .replace(",", ".")
              ),
      }))
      .filter((it) => it.product_id > 0 && it.qty > 0)

    if (!cleanedItems.length) {
      toast.error("Minimal 1 item dengan produk & qty yang valid.")
      setLoading(false)
      return
    }

    const body = {
      warehouse_id,
      date_in,
      reference: reference || null,
      note: note || null,
      items: cleanedItems,
    }

    const loadingToastId = toast.loading("Menyimpan transaksi barang masuk…")

    try {
      const res = await fetch("/api/stock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        let message = "Gagal menyimpan transaksi"
        try {
          const data = await res.json()
          if (data?.message) message = data.message
        } catch {}

        throw new Error(message)
      }

      toast.success("Berhasil menambahkan transaksi stok masuk!", {
        id: loadingToastId,
      })

      form.reset()
      setItems([{ product_id: "", qty: "", sell_price: "", buy_price: "" }])

      // kalau user punya warehouse_id, jangan direset; kalau tidak, reset
      if (!user?.warehouse_id) {
        setWarehouseId("")
      }

      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan transaksi!", {
        id: loadingToastId,
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedWarehouse = warehouses.find(
    (wh) => String(wh.id) === warehouseId
  )

  const isWarehouseStaff = !!user?.warehouse_id

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Stock In</Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Barang Masuk</DialogTitle>
          <DialogDescription>
            Isi data header dan item barang yang masuk, lalu klik simpan.
          </DialogDescription>
        </DialogHeader>

        {/* Form — footer berada di dalam form supaya tombol submit langsung bekerja */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Scrollable body */}
          <div
            className="overflow-y-auto px-0 pt-0 pb-4"
            style={{ maxHeight: "calc(80vh - 140px)" }}
          >
            {/* Header Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pt-2">
              {/* Gudang */}
              <div className="space-y-2 min-w-0">
                <Label>Gudang</Label>

                {isWarehouseStaff ? (
                  <Input
                    value={
                      selectedWarehouse
                        ? `${selectedWarehouse.name} — ${selectedWarehouse.city}`
                        : `Gudang ID ${user?.warehouse_id}`
                    }
                    disabled
                    className="w-full truncate"
                  />
                ) : (
                  <Select value={warehouseId} onValueChange={(val) => setWarehouseId(val)}>
                    <SelectTrigger id="warehouse_id" className="w-full">
                      <SelectValue placeholder={warehouses.length ? "Pilih Gudang" : "Memuat..."} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {warehouses.map((wh) => (
                        <SelectItem key={wh.id} value={String(wh.id)}>
                          <div className="flex flex-col w-full">
                            {/* Jika field sku tidak ada, bagian ini aman tetap ditampilkan */}
                            {wh.sku && (
                              <span className="text-[11px] font-mono text-muted-foreground">
                                {wh.sku}
                              </span>
                            )}
                            <span className="text-xs md:text-sm truncate max-w-[220px]">
                              {wh.name} — {wh.city}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Tanggal masuk */}
              <div className="space-y-2 min-w-0">
                <Label htmlFor="date_in">Tanggal Masuk</Label>
                <Input id="date_in" name="date_in" type="date" required className="w-full" />
              </div>

              {/* Surat Jalan */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reference">Surat Jalan</Label>
                <Input id="reference" name="reference" placeholder="INV-001 / DO-123 / dll" className="w-full" />
              </div>

              {/* Catatan */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="note">Catatan</Label>
                <Textarea
                  id="note"
                  name="note"
                  placeholder="Catatan tambahan / keterangan barang masuk"
                  className="min-h-[80px] resize-y w-full"
                />
              </div>
            </div>

            {/* Item Section */}
            <div className="space-y-3 px-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Item Barang</Label>
                <Button type="button" size="sm" variant="secondary" onClick={addItemRow}>
                  + Tambah Item
                </Button>
              </div>

              <div className="space-y-5 max-h-[40vh] overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-3 p-3 border rounded-lg relative md:grid-cols-2 min-w-0"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute top-1 right-1 text-destructive"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length === 1}
                    >
                      ✕
                    </Button>

                    {/* Produk */}
                    <div className="space-y-2 min-w-0">
                      <Label>Produk</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(val) => {
                          updateItemRow(idx, "product_id", val)
                          const p = products.find((pr) => String(pr.id) === val)
                          if (p) {
                            updateItemRow(idx, "sell_price", String(p.default_sell_price ?? ""))
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih Produk" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          {products.map((pr) => (
                            <SelectItem key={pr.id} value={String(pr.id)}>
                              <div className="flex flex-col w-full">
                                {pr.sku && (
                                  <span className="text-[11px] font-mono text-muted-foreground">
                                    {pr.sku}
                                  </span>
                                )}
                                <span className="text-xs md:text-sm truncate max-w-[220px]">
                                  {pr.name}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Qty */}
                    <div className="space-y-2 min-w-0">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => updateItemRow(idx, "qty", e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>

                    {/* jika mau menampilkan harga jual / beli, aktifkan kembali di sini */}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky footer — selalu visible */}
          <DialogFooter className="sticky bottom-0 bg-background/90 backdrop-blur-sm border-t px-4 py-3">
            <div className="w-full flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  // reset & tutup
                  setOpen(false)
                }}
                disabled={loading}
              >
                Batal
              </Button>

              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Transaksi"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

    </Dialog>
  )
}
