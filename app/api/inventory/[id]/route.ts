import { NextResponse } from "next/server"
import pool from "@/lib/db"

// DELETE /api/inventory/[id] - Delete a record by ID
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

    if (!categoryId) {
      return NextResponse.json({ error: "Missing categoryId parameter" }, { status: 400 })
    }

    // Resolve table name
    const catRes = await pool.query(`SELECT table_name FROM hardware_categories WHERE id = $1`, [categoryId])
    if (catRes.rows.length === 0 || !catRes.rows[0].table_name) {
      return NextResponse.json({ error: "Invalid category or table not found" }, { status: 400 })
    }
    const tableName = catRes.rows[0].table_name

    // Fetch the record first so we can log details
    const { rows } = await pool.query(
      `SELECT model, service_tag, serial_number, status, disposition FROM ${tableName} WHERE id = $1`,
      [id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    const record = rows[0]

    // Delete the record
    await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id])

    // Insert activity log entry
    const logId = `LOG-${Date.now().toString(36).toUpperCase()}`
    const now = new Date()
    await pool.query(
      `INSERT INTO activity_log (id, timestamp, action, item_model, item_service_tag, item_status, item_disposition)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [logId, now, "deleted", record.model, record.service_tag || record.serial_number || "N/A", record.status, record.disposition]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete inventory record:", error)
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 })
  }
}

// PUT /api/inventory/[id] - Update a record by ID
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { model, serviceTag, serialNumber, categoryId } = body

    if (!model || (!serviceTag && !serialNumber) || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Resolve table name
    const catRes = await pool.query(`SELECT table_name FROM hardware_categories WHERE id = $1`, [categoryId])
    if (catRes.rows.length === 0 || !catRes.rows[0].table_name) {
      return NextResponse.json({ error: "Invalid category or table not found" }, { status: 400 })
    }
    const tableName = catRes.rows[0].table_name

    const cleanModel = model.trim()

    // Process update
    await pool.query(
      `UPDATE ${tableName} 
       SET model = $1, service_tag = $2, serial_number = $3
       WHERE id = $4`,
      [cleanModel, serviceTag?.trim() || null, serialNumber?.trim() || null, id]
    )

    // Register model if new
    await pool.query(
      `INSERT INTO hardware_models (id, name, category_id) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
      [`MOD-${Date.now().toString(36).toUpperCase()}`, cleanModel, categoryId]
    )

    // Log the update action
    const logId = `LOG-${Date.now().toString(36).toUpperCase()}`
    const now = new Date()
    
    // We fetch the latest status and disposition just for logging
    const { rows } = await pool.query(
      `SELECT status, disposition FROM ${tableName} WHERE id = $1`,
      [id]
    )
    
    if (rows.length > 0) {
      const record = rows[0]
      await pool.query(
        `INSERT INTO activity_log (id, timestamp, action, item_model, item_service_tag, item_status, item_disposition)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [logId, now, "updated", cleanModel, serviceTag?.trim() || serialNumber?.trim() || "N/A", record.status, record.disposition]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update inventory record:", error)
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 })
  }
}
