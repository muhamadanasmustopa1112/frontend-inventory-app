import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;


  const token = request.cookies.get("token")?.value;


  const protectedPaths = ["/dashboard", "/product", "/settings"];

  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

 
  const authPaths = ["/login", "/register"];

  const isAuthPage = authPaths.some((path) =>
    pathname.startsWith(path)
  );


  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
   
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }


  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",  
    "/product/:path*",   
    "/settings/:path*",   
    "/auth/:path*",       
  ],
};
