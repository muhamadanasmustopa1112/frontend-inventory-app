import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL

type ParamsContext = {
  params: Promise<{
    id: string
  }>
}

// ============ GET /api/warehouse/[id] ============

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

    const res = await fetch(`${API_URL}/warehouses/${id}`, {
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
          message: data?.message || "Failed to fetch warehouse",
          status: res.status,
          errors: data?.errors,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching warehouse:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when fetching warehouse",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}

// ============ PUT /api/warehouse/[id] ============

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
        { message: "Missing warehouse id in route params" },
        { status: 400 }
      )
    }

    const body = await req.json()


    const res = await fetch(`${API_URL}/warehouses/${id}`, {
      method: "PUT",
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
          message: data?.message || "Failed to update warehouse",
          errors: data?.errors,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("Error updating warehouse:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when updating warehouse",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}

// ============ DELETE /api/warehouse/[id] (opsional) ============

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

    const res = await fetch(`${API_URL}/warehouses/${id}`, {
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
          message: data?.message || "Failed to delete warehouse",
          errors: data?.errors,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(
      {
        message: data?.message || "warehouse deleted",
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error deleting warehouse:", error)
    return NextResponse.json(
      {
        message: "Unexpected error when deleting warehouse",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}
