import { NextResponse } from "next/server"
import pool from "@/lib/db"

// Helper to fetch all active dynamic tables
async function getCategoryTables() {
  const { rows } = await pool.query(`SELECT table_name FROM hardware_categories WHERE table_name IS NOT NULL`)
  return rows.map(r => r.table_name)
}

// GET /api/inventory - Fetch all records across all categories
export async function GET() {
  try {
    const tableNames = await getCategoryTables()
    
    if (tableNames.length === 0) {
      return NextResponse.json([])
    }

    // Build UNION ALL query dynamically
    const queryParts = tableNames.map(tableName => `
      SELECT id, model, service_tag, serial_number, status, problem_description, disposition, category_id, date_added
      FROM ${tableName}
    `)
    
    const unionQuery = queryParts.join(" UNION ALL ") + " ORDER BY date_added DESC"

    const { rows } = await pool.query(unionQuery)

    const records = rows.map((row) => ({
      id: row.id,
      model: row.model,
      serviceTag: row.service_tag,
      serialNumber: row.serial_number,
      status: row.status,
      problemDescription: row.problem_description,
      disposition: row.disposition,
      categoryId: row.category_id,
      dateAdded: new Date(row.date_added).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    }))

    return NextResponse.json(records)
  } catch (error) {
    console.error("Failed to fetch inventory records:", error)
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
  }
}

// POST /api/inventory - Add a new record
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { model, serviceTag, serialNumber, status, problemDescription, disposition, categoryId } = body

    if (!model || !status || !disposition || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!serviceTag && !serialNumber) {
      return NextResponse.json({ error: "Must provide either Service Tag or Serial Number" }, { status: 400 })
    }

    if (!["Working", "Not Working"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }
    if (!["Keep", "Discard"].includes(disposition)) {
      return NextResponse.json({ error: "Invalid disposition value" }, { status: 400 })
    }

    // 1. Resolve table name from category
    const catRes = await pool.query(`SELECT table_name FROM hardware_categories WHERE id = $1`, [categoryId])
    if (catRes.rows.length === 0 || !catRes.rows[0].table_name) {
      return NextResponse.json({ error: "Invalid category or table not found" }, { status: 400 })
    }
    const tableName = catRes.rows[0].table_name

    const id = `HW-${Date.now().toString(36).toUpperCase()}`
    const now = new Date()
    const cleanModel = model.trim()

    // 2. Insert record into dynamic table
    await pool.query(
      `INSERT INTO ${tableName} (id, model, service_tag, serial_number, status, problem_description, disposition, category_id, date_added)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, cleanModel, serviceTag?.trim() || null, serialNumber?.trim() || null, status, problemDescription?.trim() || "", disposition, categoryId, now]
    )

    // 3. Register model if new
    await pool.query(
      `INSERT INTO hardware_models (id, name, category_id) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
      [`MOD-${Date.now().toString(36).toUpperCase()}`, cleanModel, categoryId]
    )

    // 4. Insert activity log entry
    const logId = `LOG-${Date.now().toString(36).toUpperCase()}`
    await pool.query(
      `INSERT INTO activity_log (id, timestamp, action, item_model, item_service_tag, item_status, item_disposition)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [logId, now, "added", cleanModel, serviceTag?.trim() || serialNumber?.trim() || "N/A", status, disposition]
    )

    const record = {
      id,
      model: cleanModel,
      serviceTag: serviceTag?.trim() || "",
      serialNumber: serialNumber?.trim() || "",
      status,
      problemDescription: problemDescription?.trim() || "",
      disposition,
      categoryId,
      dateAdded: now.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    }

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error("Failed to add inventory record:", error)
    return NextResponse.json({ error: "Failed to add record" }, { status: 500 })
  }
}
