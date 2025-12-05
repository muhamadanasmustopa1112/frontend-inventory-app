"use client"

import { useState } from "react"
import type React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { ScanQrDialog } from "@/components/scan-qr-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type CartUnit = {
  unitId: number
  unitCode: string
  productId: number
  sku: string
  name: string
  price: number
  warehouseId: number
}

export default function Page() {
  const [cartUnits, setCartUnits] = useState<CartUnit[]>([])
  const [buyerName, setBuyerName] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [buyerPhone, setBuyerPhone] = useState("")
  const [buyerAddress, setBuyerAddress] = useState("")
  const [invoice, setInvoice] = useState("")

  async function handleScan(code: string) {
    try {
      const res = await fetch("/api/scan-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(json?.message || "QR tidak valid / unit tidak ditemukan")
        return
      }

      const unit = json.unit
      const product = unit.product

      setCartUnits((prev) => {
        if (prev.some((u) => u.unitId === unit.id)) {
          toast.error("Unit ini sudah ada di keranjang")
          return prev
        }

        const price = Number(product.default_sell_price ?? 0)

        return [
          ...prev,
          {
            unitId: unit.id,
            unitCode: unit.unit_code ?? unit.qr_value ?? code,
            productId: product.id,
            sku: product.sku,
            name: product.name,
            price,
            warehouseId: unit.warehouse_id,
          },
        ]
      })

      toast.success(`Ditambahkan: ${product.name}`)
    } catch (err) {
      console.error(err)
      toast.error("Gagal menghubungi server")
    }
  }

  async function handleSubmit() {
    if (!buyerName.trim()) {
      toast.error("Nama buyer belum diisi")
      return
    }
    if (!buyerPhone.trim()) {
      toast.error("Nomor telepon buyer belum diisi")
      return
    }
    if (!invoice.trim()) {
      toast.error("Invoice belum diisi")
      return
    }
    if (cartUnits.length === 0) {
      toast.error("Keranjang masih kosong")
      return
    }

    const firstWarehouseId = cartUnits[0].warehouseId
    const dateOut = new Date().toISOString().slice(0, 10)


    setSubmitting(true)
    try {
      const res = await fetch("/api/stock-out/from-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_id: firstWarehouseId,
          buyer: {
            name: buyerName,
            phone: buyerPhone || null,
            address: buyerAddress || null,
          },
          date_out: dateOut,
          reference: invoice,
          note: note || null,
          units: cartUnits.map((u) => u.unitId),
        }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(json?.message || "Gagal membuat transaksi stock out")
        return
      }

      console.log(invoice)
      toast.success("Transaksi berhasil dibuat")
      setCartUnits([])
      setBuyerName("")
      setBuyerPhone("")
      setBuyerAddress("")
      setInvoice("")
      setNote("")

    } catch (err) {
      console.error(err)
      toast.error("Gagal menghubungi server")
    } finally {
      setSubmitting(false)
    }
  }

  const total = cartUnits.reduce((sum, u) => sum + u.price, 0)

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">
                Stock Out POS (Scan QR per Unit)
              </h1>
              <ScanQrDialog buttonLabel="Scan QR Unit" onScan={handleScan} />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <Label>Nama Buyer</Label>
                <Input
                  placeholder="Contoh: PT Cahaya Digital"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Nomor Telepon</Label>
                <Input
                  placeholder="0857xxxxxxx"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1 md:col-span-1">
                <Label>Alamat (opsional)</Label>
                <Input
                  placeholder="Alamat buyer"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1 md:col-span-1">
                <Label>Invoice</Label>
                <Input
                  placeholder="INV-2024-0001"
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Catatan (opsional)</Label>
              <Input
                placeholder="Catatan transaksi"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Produk</th>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-left">Unit Code</th>
                    <th className="px-3 py-2 text-right">Harga</th>
                  </tr>
                </thead>
                <tbody>
                  {cartUnits.map((u) => (
                    <tr key={u.unitId} className="border-t">
                      <td className="px-3 py-2">{u.name}</td>
                      <td className="px-3 py-2 font-mono text-xs">{u.sku}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {u.unitCode}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }).format(u.price)}
                      </td>
                    </tr>
                  ))}
                  {cartUnits.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-xs text-muted-foreground"
                      >
                        Belum ada unit di keranjang. Scan QR untuk menambahkan.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td className="px-3 py-2" colSpan={3}>
                      Total
                    </td>
                    <td className="px-3 py-2 text-right">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={submitting || cartUnits.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Transaksi"
                )}
              </Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
