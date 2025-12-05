import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL

type ParamsContext = {
  params: Promise<{
    id: string
  }>
}

// ============ GET /api/products/[id] ============

export async function GET(_req: NextRequest, context: ParamsContext) {
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

    const { id } = await context.params

    const res = await fetch(`${API_URL}/products/${id}`, {
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
          message: data?.message || "Failed to fetch product",
          status: res.status,
          errors: data?.errors,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when fetching product",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}

// ============ PUT /api/products/[id] ============

export async function PUT(req: NextRequest, context: ParamsContext) {
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

    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { message: "Missing product id in route params" },
        { status: 400 }
      )
    }

    const body = await req.json()

    console.log("Proxy PUT →", `${API_URL}/products/${id}`)

    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT", // ganti "PATCH" kalau Laravel pakai PATCH
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
          message: data?.message || "Failed to update product",
          errors: data?.errors,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when updating product",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}

// ============ DELETE /api/products/[id] (opsional) ============

export async function DELETE(_req: NextRequest, context: ParamsContext) {
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

    const { id } = await context.params

    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      return NextResponse.json(
        {
          message: data?.message || "Failed to delete product",
          errors: data?.errors,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(
      {
        message: data?.message || "Product deleted",
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when deleting product",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}
