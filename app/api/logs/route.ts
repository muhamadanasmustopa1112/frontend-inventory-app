import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type QueryParams = {
  action?: string;
  table_name?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  per_page?: string;
  page?: string;
};

async function forwardToBackend(path: string, options: RequestInit) {
  if (!API_URL) {
    throw new Error("Backend API config is missing");
  }
  const url = `${API_URL}${path}`;
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  return { res, data };
}

export async function GET(req: NextRequest) {
  try {
    if (!API_URL) {
      return NextResponse.json({ message: "Backend API config is missing" }, { status: 500 });
    }

    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized: missing token" }, { status: 401 });
    }

    const params: QueryParams = {};
    const urlSearch = req.nextUrl.searchParams;
    for (const key of ["action", "table_name", "user_id", "date_from", "date_to", "per_page", "page"]) {
      const v = urlSearch.get(key);
      if (v) (params as any)[key] = v;
    }

    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const path = `/logs${queryString ? `?${queryString}` : ""}`;

    const { res, data } = await forwardToBackend(path, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          message: data?.message || "Failed to fetch logs",
          errors: data?.errors ?? null,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error on /api/logs GET:", error);
    return NextResponse.json(
      {
        message: "Unexpected error when fetching logs",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
