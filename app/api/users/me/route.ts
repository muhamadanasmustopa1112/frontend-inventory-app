import { NextResponse } from "next/server"
import { cookies } from "next/headers"


const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function GET(req: Request) {
  try {
  
    const token = (await cookies()).get("token")?.value

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: token missing" },
        { status: 401 }
      )
    }

    const res = await fetch(`${API_URL}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json(
        { message: "Failed to fetch user" },
        { status: res.status }
      )
    }

    const data = await res.json().catch(() => null)
    const user = data?.data ?? data

    return NextResponse.json(user)
  } catch (err) {
    console.error("Error fetching user:", err)
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    )
  }
}
