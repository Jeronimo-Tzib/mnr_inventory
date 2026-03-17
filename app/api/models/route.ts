import { NextResponse } from "next/server"
import pool from "@/lib/db"

// GET /api/models - Fetch all known models
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

    let query = `SELECT id, name, category_id FROM hardware_models ORDER BY name ASC`
    let values: any[] = []

    if (categoryId) {
      query = `SELECT id, name, category_id FROM hardware_models WHERE category_id = $1 ORDER BY name ASC`
      values = [categoryId]
    }

    const { rows } = await pool.query(query, values)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Failed to fetch models:", error)
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 })
  }
}
