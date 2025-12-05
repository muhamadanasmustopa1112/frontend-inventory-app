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

    const body = await req.json().catch(() => null)
    if (!body?.units || !Array.isArray(body.units) || body.units.length === 0) {
      return NextResponse.json(
        { message: "Units array wajib diisi" },
        { status: 422 }
      )
    }

    // Kalau staff gudang, paksa warehouse_id = warehouse user
    const payload = {
      ...body,
      warehouse_id:
        user.warehouse_id !== null ? user.warehouse_id : body.warehouse_id,
    }

    const res = await fetch(`${API_URL}/stock-out/from-units`, {
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
          message: data?.message || "Failed to create stock-out from units",
          errors: data?.errors,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("Error creating stock-out from units:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when creating stock-out from units",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}
