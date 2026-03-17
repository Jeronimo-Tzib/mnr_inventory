import { NextResponse } from "next/server"
import pool from "@/lib/db"

// DELETE /api/categories/[id] - Delete a category (Admin Protected in middleware)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id

    // Check if category is used in inventory_records
    const checkRes = await pool.query(
      `SELECT id FROM inventory_records WHERE category_id = $1 LIMIT 1`,
      [categoryId]
    )

    if (checkRes.rows.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category because it is used by existing inventory records." },
        { status: 400 }
      )
    }

    await pool.query(`DELETE FROM hardware_categories WHERE id = $1`, [categoryId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete category:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
