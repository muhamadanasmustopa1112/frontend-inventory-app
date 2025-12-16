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
  const user = (data?.data as BackendUser) ?? (data as BackendUser)
  return user ?? null
}

export async function GET(req: NextRequest) {
  try {
    if (!API_URL) {
      return NextResponse.json(
        { message: "Backend API config is missing" },
        { status: 500 }
      )
    }

    /* ================= AUTH ================= */

    const cookieStore = cookies()
    const token = (await cookieStore).get("token")?.value

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: missing token" },
        { status: 401 }
      )
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json(
        { message: "Failed to get current user" },
        { status: 500 }
      )
    }

    /* ================= QUERY PARAM ================= */

    const { searchParams } = new URL(req.url)

    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const requestedWarehouseId = searchParams.get("warehouse_id")

    const qs = new URLSearchParams()

    if (dateFrom) qs.set("date_from", dateFrom)
    if (dateTo) qs.set("date_to", dateTo)

    // staff gudang → paksa gudang sendiri
    if (user.warehouse_id !== null) {
      qs.set("warehouse_id", String(user.warehouse_id))
    } else {
      // admin → boleh pilih gudang
      if (requestedWarehouseId) {
        qs.set("warehouse_id", requestedWarehouseId)
      }
    }

    /* ================= BACKEND URL ================= */

    const backendUrl = `${API_URL}/reports/stock-in/export-units${
      qs.toString() ? `?${qs.toString()}` : ""
    }`

    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      return NextResponse.json(
        {
          message: data?.message || "Failed to fetch stock-in report",
          errors: data?.errors,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching stock-in report:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when fetching stock-in report",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}
