import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function GET(_req: NextRequest) {
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

    const res = await fetch(`${API_URL}/products` , {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "")
      return NextResponse.json(
        {
          message: "Failed to fetch products from backend",
          status: res.status,
          backendResponse: errorBody,
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when fetching products",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
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

    const body = await req.json()

    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      return NextResponse.json(
        {
          message: data?.message || "Failed to create product",
          errors: data?.errors,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when creating product",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}

