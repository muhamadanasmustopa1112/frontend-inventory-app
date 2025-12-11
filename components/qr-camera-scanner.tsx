"use client"

import { Html5QrcodeScanner } from "html5-qrcode"
import { useEffect, useRef } from "react"

type QrCameraScannerProps = {
  onDetected: (code: string) => void
  stop?: boolean
}

export function QrCameraScanner({ onDetected, stop }: QrCameraScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250,
        videoConstraints: { facingMode: { ideal: "environment" } },
      },
      false
    )
    scannerRef.current = scanner

    scanner.render(
      (decodedText) => {
        onDetected(decodedText)
        scanner.clear().catch(() => {})
      },
      () => {}
    )

    return () => {
      scannerRef.current?.clear().catch(() => {})
    }
  }, [onDetected])

  useEffect(() => {
    if (stop) {
      scannerRef.current?.clear().catch(() => {})
    }
  }, [stop])

  return <div id="qr-reader" className="w-[280px] max-w-full" />
}
