"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2, FolderPlus } from "lucide-react"
import { useInventory } from "../inventory-context"
import { useAuth } from "../auth-context"

export default function CategoriesPage() {
  const { categories } = useInventory()
  const { user } = useAuth()
  const [newCategory, setNewCategory] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  if (user?.role !== "Admin") {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-red-500 font-mono tracking-widest text-sm">ACCESS DENIED</p>
      </div>
    )
  }

  const handleAdd = async () => {
    if (!newCategory.trim()) return
    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to add category")
      }

      setNewCategory("")
      // Categories automatically revalidated if we refresh or via swr revalidate trigger
      // but let's simply reload for the prototype if context doesn't expose mutateCategories
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to delete category")
        return
      }
      window.location.reload()
    } catch {
      alert("Error deleting category")
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">HARDWARE CATEGORIES</h1>
          <p className="text-sm text-neutral-400">Manage equipment classifications (Admin only)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ADD CATEGORY */}
        <Card className="md:col-span-1 bg-neutral-900 border-neutral-700 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-orange-500" />
              NEW CATEGORY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">CATEGORY NAME</Label>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Scanners"
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button
              onClick={handleAdd}
              disabled={saving || !newCategory.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white tracking-wider"
            >
              <Plus className="w-4 h-4 mr-2" />
              {saving ? "ADDING..." : "ADD"}
            </Button>
          </CardContent>
        </Card>

        {/* CATEGORIES LIST */}
        <Card className="md:col-span-2 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">EXISTING CATEGORIES</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-neutral-500 text-sm py-4">No categories found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-700 hover:bg-transparent">
                    <TableHead className="text-xs text-neutral-400 tracking-wider">ID</TableHead>
                    <TableHead className="text-xs text-neutral-400 tracking-wider">NAME</TableHead>
                    <TableHead className="text-right w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id} className="border-neutral-800 hover:bg-neutral-800/50">
                      <TableCell className="text-xs text-neutral-500 font-mono">{cat.id}</TableCell>
                      <TableCell className="text-sm text-white">{cat.name}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cat.id)}
                          className="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 h-8 w-8"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
