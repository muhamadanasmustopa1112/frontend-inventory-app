export type CurrentUser = {
  id: number
  name: string
  email?: string
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await fetch("/api/users/me", {
      method: "GET",
      cache: "no-store",
    })

    if (!res.ok) return null

    const user = await res.json()
    return user as CurrentUser
  } catch (err) {
    console.error("getCurrentUser error:", err)
    return null
  }
}
