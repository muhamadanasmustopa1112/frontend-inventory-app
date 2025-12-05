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

    const url = new URL(req.url)
    const searchParams = url.searchParams

    if (!searchParams.get("page")) {
      searchParams.set("page", "1")
    }
    if (!searchParams.get("per_page")) {
      searchParams.set("per_page", "20")
    }

    const requestedWarehouseId = searchParams.get("warehouse_id")

    if (user.warehouse_id !== null) {
      searchParams.set("warehouse_id", String(user.warehouse_id))
    } else {
      if (requestedWarehouseId) {
        searchParams.set("warehouse_id", requestedWarehouseId)
      } else {
        searchParams.delete("warehouse_id")
      }
    }

    const backendUrl = `${API_URL}/reports/sales${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
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
          message: data?.message || "Failed to fetch sales report",
          errors: data?.errors,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching sales report:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when fetching sales report",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}
