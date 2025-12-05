"use client"

import { Html5QrcodeScanner } from "html5-qrcode"
import { useEffect } from "react"

type QrCameraScannerProps = {
  onDetected: (code: string) => void
}

export function QrCameraScanner({ onDetected }: QrCameraScannerProps) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader", 
      {
        fps: 10,
        qrbox: 250, 
      },
      false
    )

    scanner.render(
      (decodedText) => {
        // Kalau berhasil baca QR
        onDetected(decodedText)
        // Kalau mau langsung stop setelah 1x scan:
        scanner.clear().catch(() => {})
      },
      () => {
        // error per frame, biasakan di-ignore aja
      }
    )

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [onDetected])

  return (
    <div className="flex justify-center">
      <div id="qr-reader" className="w-[280px] max-w-full" />
    </div>
  )
}
