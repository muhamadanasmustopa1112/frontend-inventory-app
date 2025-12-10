"use client"

import React from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

type ProductItem = {
  id: number
  qty: number
  product?: {
    sku?: string | null
    name?: string | null
  }
}

export type StockInForPrint = {
  id: number
  warehouse?: { name?: string | null }
  reference?: string | null
  date_in?: string
  items: ProductItem[]
}

export function PrintButtonStockIn({
  item,
  label = "Print",
  onError,
  onSuccess,
}: {
  item: StockInForPrint
  label?: string
  onError?: (err: unknown) => void
  onSuccess?: () => void
}) {
  const [loading, setLoading] = React.useState(false)

  async function handlePrint() {
    setLoading(true)
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" })
      const marginLeft = 40
      const pageWidth = doc.internal.pageSize.getWidth()
      const usableWidth = pageWidth - marginLeft * 2

      // ================= LOGO =================
      const logoUrl = "/logo.png" 
      const img = new Image()
      img.src = logoUrl
      await new Promise((res) => {
        img.onload = res
      })

      const logoWidth = 120
      const logoHeight = 30
      const logoX = pageWidth - marginLeft - logoWidth
      const logoY = 20
      doc.addImage(img, "PNG", logoX, logoY, logoWidth, logoHeight)

      // ================= JUDUL =================
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text("Surat Jalan Masuk", marginLeft, 40)

      // ================= INFORMASI =================
      const dt = item.date_in ? new Date(item.date_in) : new Date()
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)

      let cursorY = 70
      const labelX = marginLeft
      const colonX = 120 
      const valueX = colonX + 5

      const info = [
        ["Gudang", item.warehouse?.name ?? "-"],
        ["Surat Jalan", item.reference ?? "-"],
        [
          "Tanggal",
          `${dt.toLocaleDateString("id-ID")}`,
        ],
      ]

      info.forEach(([label, value]) => {
        doc.text(label, labelX, cursorY)
        doc.text(":", colonX, cursorY)
        doc.text(value, valueX, cursorY)
        cursorY += 14
      })

      cursorY += 10

      // ================= TABEL ITEM =================
      const body = item.items.map((it) => [
        it.product?.sku ?? "-",
        it.product?.name ?? "-",
        String(it.qty ?? 0),
      ])

      autoTable(doc, {
        startY: cursorY,
        head: [["SKU", "Nama Produk", "Qty"]],
        body,
        margin: { left: marginLeft, right: marginLeft },
        styles: {
            fontSize: 10,
            cellPadding: 6,
            valign: "middle",
            overflow: "ellipsize",
            lineColor: [220, 220, 220], 
            lineWidth: 0.5,
        },
        headStyles: {
            fillColor: [230, 230, 250], 
            textColor: 30,
            fontStyle: "bold",
            halign: "center",
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
        columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: usableWidth - 70 - 40 },
            2: { cellWidth: 40, halign: "right" },
        },
        didDrawCell: (data) => {
            if (data.section === "head") {
            doc.setLineWidth(1)
            doc.line(
                data.cell.x,
                data.cell.y + data.cell.height,
                data.cell.x + data.cell.width,
                data.cell.y + data.cell.height
            )
            }
        },
      })

      // ================= TOTAL QTY =================
      const finalY = (doc as any).lastAutoTable?.finalY ?? doc.internal.pageSize.getHeight() - 60
      const totalQty = item.items.reduce((s, it) => s + (it.qty ?? 0), 0)
      doc.setFont("helvetica", "bold")
      doc.text(`Total Qty: ${totalQty}`, marginLeft, finalY + 20)

      // ================= TANDA TANGAN =================
        const signatureY = finalY + 120
        const gap = 120
        const lineLength = 200 
        const lineHeight = 100

        doc.text("Dibuat Oleh,", marginLeft, signatureY - 10)
        doc.line(
             marginLeft,
            signatureY + lineHeight,         
            marginLeft + lineLength,
            signatureY + lineHeight
        );

        const penerimaX = marginLeft + lineLength + gap;
        const dateY = signatureY - 50; 
        const diterimaY = signatureY;  
        const lineY = diterimaY + lineHeight; 

        const spaces = " ".repeat(2);
        const dots = ".".repeat(30);

        doc.text(`${dots},${spaces}${dots}`, penerimaX, dateY);
        doc.text("Diterima Oleh,", penerimaX, diterimaY);

        doc.line(
            penerimaX,
            lineY, 
            penerimaX + lineLength,
            lineY
        )


      doc.save(`surat-jalan-${item.id}.pdf`)
      onSuccess?.()
    } catch (err) {
      console.error("Print error:", err)
      onError?.(err)
      alert("Gagal membuat PDF. Periksa console.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center gap-2 rounded border px-3 py-1 text-sm"
      disabled={loading}
      type="button"
    >
      {loading ? "Membuat..." : label}
    </button>
  )
}
