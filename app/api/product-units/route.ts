// app/api/product-units/route.ts
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

  try {
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
  } catch (err) {
    console.error("Error calling /me:", err)
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!API_URL) {
      return NextResponse.json(
        { message: "Backend API config is missing" },
        { status: 500 }
      )
    }

    // cookies() ga perlu await
    const cookieStore = cookies()
    const token = (await cookieStore).get("token")?.value

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // ambil user buat cek warehouse_id
    const user = await getCurrentUser(token)

    const url = new URL(req.url)
    const searchParams = url.searchParams

    // default pagination kalau frontend tidak kirim
    // if (!searchParams.get("page")) {
    //   searchParams.set("page", "1")
    // }
    // if (!searchParams.get("per_page")) {
    //   searchParams.set("per_page", "100")
    // }

    // kalau user punya warehouse_id → paksa filter ke gudangnya sendiri
    if (user?.warehouse_id !== null && user?.warehouse_id !== undefined) {
      searchParams.set("warehouse_id", String(user.warehouse_id))
    }
    // kalau user.warehouse_id null → admin pusat
    // boleh pakai warehouse_id dari query (kalau ada) atau tanpa filter

    const backendUrl = `${API_URL}/product-units?${searchParams.toString()}`

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
          message: data?.message || "Failed to fetch product units",
          backendResponse: data,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error("Error fetching product units:", err)
    return NextResponse.json(
      {
        message: "Unexpected error",
        error: err?.message ?? String(err),
      },
      { status: 500 }
    )
  }
}
