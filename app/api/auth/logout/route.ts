import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logout berhasil" },
    { status: 200 }
  );

  // hapus cookie token
  response.cookies.set("token", "", {
    maxAge: 0,
    path: "/",
  });

  return response;
}
