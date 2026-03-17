import { NextResponse } from "next/server"
import pool from "@/lib/db"

// GET /api/activity-log - Fetch all activity log entries
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, timestamp, action, item_model, item_service_tag, item_status, item_disposition
       FROM activity_log
       ORDER BY timestamp DESC`
    )

    const entries = rows.map((row) => ({
      id: row.id,
      timestamp: new Date(row.timestamp).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      action: row.action,
      itemModel: row.item_model,
      itemServiceTag: row.item_service_tag,
      itemStatus: row.item_status,
      itemDisposition: row.item_disposition,
    }))

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Failed to fetch activity log:", error)
    return NextResponse.json({ error: "Failed to fetch activity log" }, { status: 500 })
  }
}
