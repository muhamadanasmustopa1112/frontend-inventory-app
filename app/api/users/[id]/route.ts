import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
const DEFAULT_TIMEOUT = 10000 

async function getToken() {
  return (await cookies()).get("token")?.value
}

function createAbortSignal(timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  return { signal: controller.signal, cleanup: () => clearTimeout(id) }
}

async function proxyFetch(url: string, opts: RequestInit = {}, timeout = DEFAULT_TIMEOUT) {
  const { signal, cleanup } = createAbortSignal(timeout)
  try {
    const res = await fetch(url, { ...opts, signal })
    const data = await res.json().catch(() => null)
    return { res, data }
  } finally {
    cleanup()
  }
}

export async function GET(req: NextRequest, context: { params: any }) {
  try {
    if (!API_URL) {
      return NextResponse.json({ message: "Backend API config is missing" }, { status: 500 })
    }

    const token = await getToken()
    if (!token) {
      return NextResponse.json({ message: "Unauthorized: missing token" }, { status: 401 })
    }

    const params = await context.params
    const id = params?.id
    if (!id) {
      return NextResponse.json({ message: "Missing user id" }, { status: 400 })
    }

    const backendUrl = `${API_URL}/users/${encodeURIComponent(String(id))}`

    const { res, data } = await proxyFetch(
      backendUrl,
      {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
      DEFAULT_TIMEOUT
    )

    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to fetch user", errors: data?.errors },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error("Error fetching user:", err)
    const isAbort = err?.name === "AbortError"
    return NextResponse.json(
      {
        message: isAbort ? "Request timed out when fetching user" : "Unexpected error when fetching user",
        error: err?.message ?? String(err),
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest, context: { params: any }) {
  try {
    if (!API_URL) {
      return NextResponse.json({ message: "Backend API config is missing" }, { status: 500 })
    }

    const token = await getToken()
    if (!token) {
      return NextResponse.json({ message: "Unauthorized: missing token" }, { status: 401 })
    }

    const params = await context.params
    const id = params?.id
    if (!id) {
      return NextResponse.json({ message: "Missing user id" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))

    const backendUrl = `${API_URL}/users/${encodeURIComponent(String(id))}`

    const { res, data } = await proxyFetch(
      backendUrl,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      },
      DEFAULT_TIMEOUT
    )

    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to update user", errors: data?.errors },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    console.error("Error updating user:", err)
    const isAbort = err?.name === "AbortError"
    return NextResponse.json(
      {
        message: isAbort ? "Request timed out when updating user" : "Unexpected error when updating user",
        error: err?.message ?? String(err),
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, context: { params: any }) {
  try {
    if (!API_URL) {
      return NextResponse.json({ message: "Backend API config is missing" }, { status: 500 })
    }

    const token = await getToken()
    if (!token) {
      return NextResponse.json({ message: "Unauthorized: missing token" }, { status: 401 })
    }

    const params = await context.params
    const id = params?.id
    if (!id) {
      return NextResponse.json({ message: "Missing user id" }, { status: 400 })
    }

    const backendUrl = `${API_URL}/users/${encodeURIComponent(String(id))}`

    const { res, data } = await proxyFetch(
      backendUrl,
      {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      },
      DEFAULT_TIMEOUT
    )

    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to delete user", errors: data?.errors },
        { status: res.status }
      )
    }

    return NextResponse.json(data ?? { message: "User deleted" }, { status: res.status })
  } catch (err: any) {
    console.error("Error deleting user:", err)
    const isAbort = err?.name === "AbortError"
    return NextResponse.json(
      {
        message: isAbort ? "Request timed out when deleting user" : "Unexpected error when deleting user",
        error: err?.message ?? String(err),
      },
      { status: 500 }
    )
  }
}
