import { NextResponse } from "next/server"
import pool from "@/lib/db"

// GET /api/categories - Fetch all categories
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, created_at FROM hardware_categories ORDER BY name ASC`
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

// POST /api/categories - Add a new category (Admin Protected in middleware)
export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const cleanName = name.trim()
    const id = `CAT-${Date.now().toString(36).toUpperCase()}`
    
    // Create a safe table name: lowercase, replace spaces with underscores, remove special chars
    const safeTableName = `hw_${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`

    // 1. Create the new table for this category
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${safeTableName} (
        id TEXT PRIMARY KEY,
        model TEXT NOT NULL,
        service_tag TEXT,
        serial_number TEXT,
        status TEXT NOT NULL CHECK (status IN ('Working', 'Not Working')),
        problem_description TEXT NOT NULL DEFAULT '',
        disposition TEXT NOT NULL CHECK (disposition IN ('Keep', 'Discard')),
        category_id TEXT REFERENCES hardware_categories(id) ON DELETE CASCADE,
        date_added TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `
    await pool.query(createTableQuery)

    // 2. Insert into the hardware_categories registry
    await pool.query(
      `INSERT INTO hardware_categories (id, name, table_name) VALUES ($1, $2, $3)`,
      [id, cleanName, safeTableName]
    )

    return NextResponse.json({ id, name: cleanName, tableName: safeTableName }, { status: 201 })
  } catch (error: any) {
    console.error("Failed to add category:", error)
    if (error.code === '23505') { // Postgres unique violation code
      return NextResponse.json({ error: "Category already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to add category" }, { status: 500 })
  }
}
