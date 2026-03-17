import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { signToken } from "@/lib/auth"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Since we seeded password hashes as simple SHA-256 for the prototype, we use the same here.
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex")

    const { rows } = await pool.query(
      `SELECT id, username, role FROM users WHERE username = $1 AND password_hash = $2`,
      [username, hashedPassword]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    const user = rows[0]
    
    // Create JWT
    const token = await signToken({
      id: user.id,
      username: user.username,
      role: user.role
    })

    const response = NextResponse.json({ success: true, user })

    // Set cookie
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
