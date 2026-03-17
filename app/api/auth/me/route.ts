import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  try {
    const verifiedToken = await verifyAuth(token)
    return NextResponse.json({ user: verifiedToken })
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
