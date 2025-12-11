"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrCameraScanner } from "@/components/qr-camera-scanner"
import { toast } from "sonner"

type ScanQrDialogProps = {
  onScan: (code: string) => void
  buttonLabel?: string
}

export function ScanQrDialog({ onScan, buttonLabel = "Scan QR" }: ScanQrDialogProps) {
  const [open, setOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  function handleDetected(code: string) {
    if (isScanning) return
    setIsScanning(true)

    toast.success(`QR terbaca: ${code}`)

    // lempar ke parent
    onScan(code)

    // tutup dialog
    setOpen(false)

    // reset flag
    setTimeout(() => setIsScanning(false), 300)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setIsScanning(false)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          {buttonLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Scan QR Unit</DialogTitle>
          <DialogDescription>
            Arahkan kamera ke QR di label unit. Setelah terbaca, unit akan otomatis dimasukkan ke daftar.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 flex justify-center">
          <QrCameraScanner onDetected={handleDetected} stop={!open} />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
