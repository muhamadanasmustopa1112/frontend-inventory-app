import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    return NextResponse.json(
      {
        message: errorData?.message || "Login gagal",
      },
      { status: res.status }
    );
  }

  const data = await res.json();
 

  const token = data.token as string;

  const response = NextResponse.json(
    {
      message: "Login berhasil",
      user: data.user,
    },
    { status: 200 }
  );

  response.cookies.set("token", token, {
    httpOnly: true,       
    secure: true,         
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, 
  });

  return response;
}
