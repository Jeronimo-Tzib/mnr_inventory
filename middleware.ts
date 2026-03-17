import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAuth } from "./lib/auth"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value
  const { pathname } = request.nextUrl

  // Allow auth APIs
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next()
  }

  // Determine if it's a login page
  const isLoginPage = pathname === "/login"

  // Handle protected API routes
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    try {
      const verifiedToken = await verifyAuth(token)
      // Check Admin-only APIs
      const isAdminOnly =
        ((request.method === "POST" || request.method === "DELETE") && pathname.startsWith("/api/categories")) ||
        (request.method === "DELETE" && pathname.startsWith("/api/inventory/"))
      if (isAdminOnly) {
        if (verifiedToken.role !== "Admin") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
      }
      return NextResponse.next()
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  // Handle frontend routes
  if (!token) {
    if (isLoginPage || pathname.startsWith("/_next") || pathname.includes("favicon")) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    await verifyAuth(token)
    if (isLoginPage) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  } catch {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
