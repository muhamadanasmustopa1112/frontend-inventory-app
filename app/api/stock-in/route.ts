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

  // Kalau backend kamu balikin { data: {...} }, sesuaikan di sini
  const user = (data?.data as BackendUser) ?? (data as BackendUser)
  return user ?? null
}

/**
 * GET /api/stock-in
 *
 * - User dengan warehouse_id ≠ null  → SELALU difilter ke gudangnya sendiri
 * - User dengan warehouse_id = null  → dianggap admin, boleh pakai ?warehouse_id= kalau mau filter
 */
export async function GET(req: NextRequest) {
  try {
    if (!API_URL) {
      return NextResponse.json(
        { message: "Backend API config is missing" },
        { status: 500 }
      )
    }

    const token = (await cookies()).get("token")?.value
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

    const { searchParams } = new URL(req.url)
    const page = searchParams.get("page") ?? "1"
    const perPage = searchParams.get("per_page") ?? "20"
    const requestedWarehouseId = searchParams.get("warehouse_id")

    const query = new URLSearchParams()
    query.set("page", page)
    query.set("per_page", perPage)

    if (user.warehouse_id !== null) {
      query.set("warehouse_id", String(user.warehouse_id))
    } else {
      if (requestedWarehouseId) {
        query.set("warehouse_id", requestedWarehouseId)
      }
    }

    const backendUrl = `${API_URL}/stock-in?${query.toString()}`

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
          message: "Failed to fetch stock-in from backend",
          status: res.status,
          backendResponse: data,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching stock-in:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when fetching stock-in",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stock-in
 *
 * - User dengan warehouse_id ≠ null  → dianggap staff gudang, warehouse_id di-override
 * - User dengan warehouse_id = null  → admin, bebas kirim warehouse_id apa saja
 */
export async function POST(req: NextRequest) {
  try {
    if (!API_URL) {
      return NextResponse.json(
        { message: "Backend API config is missing" },
        { status: 500 }
      )
    }

    const token = (await cookies()).get("token")?.value
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

    const body = await req.json()

    let payload = body

    if (user.warehouse_id !== null) {
      // STAFF GUDANG: paksa pakai gudangnya sendiri
      payload = {
        ...body,
        warehouse_id: user.warehouse_id,
      }
    }
    // kalau warehouse_id null → admin, payload dibiarkan apa adanya

    const res = await fetch(`${API_URL}/stock-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      return NextResponse.json(
        {
          message: data?.message || "Failed to create stock-in",
          errors: data?.errors,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("Error creating stock-in:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when creating stock-in",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}
