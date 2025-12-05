import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL

type BackendUser = {
  id: number
  name: string
  warehouse_id: number | null
}

async function getCurrentUser(token: string): Promise<BackendUser | null> {
  if (!API_URL) return null

  const res = await fetch(`${API_URL}/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  })

  if (!res.ok) {
    console.error("Failed to fetch /me:", res.status)
    return null
  }

  const data = await res.json().catch(() => null)

  // kalau backend balikin { data: {...} } sesuaikan di sini
  const user = (data?.data as BackendUser) ?? (data as BackendUser)
  return user ?? null
}

/**
 * POST /api/scan-qr
 *
 * - Ambil token dari cookie (sama kayak /api/stock-in)
 * - Validasi user lewat /me (optional tapi konsisten)
 * - Teruskan request ke backend Laravel: POST /api/scan-qr
 */
export async function POST(req: NextRequest) {
  try {
    if (!API_URL) {
      return NextResponse.json(
        { message: "Backend API config is missing" },
        { status: 500 }
      )
    }

    // Ambil token dari cookie
    const token = (await cookies()).get("token")?.value
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: missing token" },
        { status: 401 }
      )
    }

    // Optional: cek user valid (biar konsisten sama /stock-in)
    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json(
        { message: "Failed to get current user" },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => null)

    if (!body?.code) {
      return NextResponse.json(
        { message: "Code QR wajib diisi" },
        { status: 422 }
      )
    }

    // Teruskan ke Laravel: POST /api/scan-qr
    const res = await fetch(`${API_URL}/scan-qr`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ⬅️ pakai token user, sama kayak /stock-in
      },
      body: JSON.stringify({ code: body.code }),
      cache: "no-store",
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      // error dari backend (404 unit not found, 409 status tidak IN_STOCK, dll)
      return NextResponse.json(
        {
          message: data?.message || "Failed to scan QR",
          errors: data?.errors,
        },
        { status: res.status }
      )
    }

    // sukses: kembalikan apa adanya (message + unit)
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("Error on /api/scan-qr:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when scanning QR",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}
