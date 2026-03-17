"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  HardDrive,
  Plus,
  Package,
  CheckCircle,
  XCircle,
  Archive,
  Trash2,
  Edit,
} from "lucide-react"
import { useInventory, InventoryRecord } from "../inventory-context"
import { useAuth } from "../auth-context"

export default function InventoryPage() {
  const { records, categories, models: dbModels, stats, addRecord, editRecord, deleteRecord } = useInventory()
  const { user } = useAuth()

  // Form state
  const [model, setModel] = useState("")
  const [newModel, setNewModel] = useState("")
  const [serviceTag, setServiceTag] = useState("")
  const [serialNumber, setSerialNumber] = useState("")
  const [status, setStatus] = useState<"Working" | "Not Working">("Working")
  const [problemDescription, setProblemDescription] = useState("")
  const [disposition, setDisposition] = useState<"Keep" | "Discard">("Keep")
  const [categoryId, setCategoryId] = useState<string>("")
  

  
  // Validation errors
  const [errors, setErrors] = useState<{ model?: string; identifiers?: string; categoryId?: string }>({})
  const [saving, setSaving] = useState(false)

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<InventoryRecord | null>(null)
  const [editModel, setEditModel] = useState("")
  const [editServiceTag, setEditServiceTag] = useState("")
  const [editSerialNumber, setEditSerialNumber] = useState("")
  const [editStatus, setEditStatus] = useState<"Working" | "Not Working">("Working")
  const [editDisposition, setEditDisposition] = useState<"Keep" | "Discard">("Keep")
  const [editCategoryId, setEditCategoryId] = useState<string>("")
  const [savingEdit, setSavingEdit] = useState(false)

  // Derive unique models from the models API for autocomplete
  const uniqueModels = useMemo(() => {
    // Optionally filter by selected category if we wanted to enforce it
    let filteredModels = dbModels
    if (categoryId) {
      filteredModels = dbModels.filter(m => m.category_id === categoryId)
    }
    const names = new Set(filteredModels.map(m => m.name))
    return Array.from(names).sort()
  }, [dbModels, categoryId])

  const handleSave = async () => {
    const newErrors: { model?: string; identifiers?: string; categoryId?: string } = {}
    const finalModel = newModel.trim() || model

    if (!finalModel) {
      newErrors.model = "Please select an existing model or type a new one"
    }
    if (!serviceTag.trim() && !serialNumber.trim()) {
      newErrors.identifiers = "Either Service Tag OR Serial Number is required"
    }
    if (categories.length > 0 && !categoryId) {
      newErrors.categoryId = "Category is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setSaving(true)

    try {
      await addRecord({
        model: finalModel,
        serviceTag: serviceTag.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        status,
        problemDescription: problemDescription.trim(),
        disposition,
        categoryId: categoryId || undefined
      } as any)

      // Reset form
      setModel("")
      setNewModel("")
      setServiceTag("")
      setSerialNumber("")
      setStatus("Working")
      setProblemDescription("")
      setDisposition("Keep")
      setCategoryId("")
    } catch {
      // Error is logged in context
    } finally {
      setSaving(false)
    }
  }

  const handleOpenEdit = (rec: InventoryRecord) => {
    setEditingRecord(rec)
    setEditModel(rec.model)
    setEditServiceTag(rec.serviceTag || "")
    setEditSerialNumber(rec.serialNumber || "")
    setEditStatus(rec.status)
    setEditDisposition(rec.disposition)
    setEditCategoryId(rec.categoryId || "")
  }

  const handleSaveEdit = async () => {
    if (!editingRecord) return
    setSavingEdit(true)
    try {
      await editRecord(editingRecord.id, {
        model: editModel,
        serviceTag: editServiceTag,
        serialNumber: editSerialNumber,
        categoryId: editCategoryId || undefined
      })
      setEditingRecord(null)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async (id: string, catId?: string) => {
    if(!catId) return alert("Missing category tracking reference unable to delete.")
    await deleteRecord(id, catId)
  }

  const getCategoryName = (cid?: string) => {
    if (!cid) return "--"
    const cat = categories.find(c => c.id === cid)
    return cat ? cat.name : "Unknown"
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">HARDWARE INVENTORY</h1>
          <p className="text-sm text-neutral-400">Equipment tracking and disposition management</p>
        </div>
        <Badge className="bg-orange-500/20 text-orange-500 text-xs tracking-wider">
          {stats.totalItems} ITEMS LOGGED
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ADD ITEM FORM */}
        <Card className="xl:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-500" />
              ADD HARDWARE ITEM
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-neutral-400 tracking-wider">
                  CATEGORY <span className="text-red-500">*</span>
                </Label>
                <Select value={categoryId} onValueChange={(v) => {
                  setCategoryId(v)
                  if(errors.categoryId) setErrors(prev => ({...prev, categoryId: undefined}))
                }}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white focus:border-orange-500 focus:ring-orange-500/20">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">
                EXISTING MODEL
              </Label>
              <Select value={model} onValueChange={(v) => {
                setModel(v)
                setNewModel("")
                if (errors.model) setErrors(prev => ({...prev, model: undefined}))
              }}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white focus:border-orange-500 focus:ring-orange-500/20">
                  <SelectValue placeholder="Select an existing model..." />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  {uniqueModels.length === 0 ? (
                    <SelectItem value="__none__" disabled className="text-neutral-500">No models yet</SelectItem>
                  ) : (
                    uniqueModels.map((m) => (
                      <SelectItem key={m} value={m} className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">
                        {m}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newModel" className="text-xs text-neutral-400 tracking-wider">
                OR NEW MODEL
              </Label>
              <Input
                id="newModel"
                value={newModel}
                onChange={(e) => {
                  setNewModel(e.target.value)
                  setModel("")
                  if (errors.model) setErrors(prev => ({...prev, model: undefined}))
                }}
                placeholder="Type a new model name..."
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600 focus:border-orange-500 focus:ring-orange-500/20"
              />
              {errors.model && <p className="text-xs text-red-500">{errors.model}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceTag" className="text-xs text-neutral-400 tracking-wider">
                  SERVICE TAG
                </Label>
                <Input
                  id="serviceTag"
                  value={serviceTag}
                  onChange={(e) => {
                    setServiceTag(e.target.value)
                    if (errors.identifiers) setErrors((prev) => ({ ...prev, identifiers: undefined }))
                  }}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600 focus:border-orange-500 focus:ring-orange-500/20 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="text-xs text-neutral-400 tracking-wider">
                  SERIAL NUMBER
                </Label>
                <Input
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => {
                    setSerialNumber(e.target.value)
                    if (errors.identifiers) setErrors((prev) => ({ ...prev, identifiers: undefined }))
                  }}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600 focus:border-orange-500 focus:ring-orange-500/20 font-mono"
                />
              </div>
            </div>
            {errors.identifiers && <p className="text-xs text-red-500">{errors.identifiers}</p>}

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">STATUS</Label>
              <Select value={status} onValueChange={(v: "Working" | "Not Working") => setStatus(v)}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white focus:border-orange-500 focus:ring-orange-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  <SelectItem value="Working" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      Working
                    </span>
                  </SelectItem>
                  <SelectItem value="Not Working" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Not Working
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="problemDescription" className="text-xs text-neutral-400 tracking-wider">
                PROBLEM DESCRIPTION <span className="text-neutral-600">(optional)</span>
              </Label>
              <Textarea
                id="problemDescription"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Describe any issues..."
                rows={3}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600 focus:border-orange-500 focus:ring-orange-500/20 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">DISPOSITION</Label>
              <Select value={disposition} onValueChange={(v: "Keep" | "Discard") => setDisposition(v)}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white focus:border-orange-500 focus:ring-orange-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  <SelectItem value="Keep" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">
                    <span className="flex items-center gap-2">
                      <Archive className="w-3 h-3" />
                      Keep
                    </span>
                  </SelectItem>
                  <SelectItem value="Discard" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">
                    <span className="flex items-center gap-2">
                      <Trash2 className="w-3 h-3" />
                      Discard
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 text-white tracking-wider disabled:opacity-50">
              <HardDrive className="w-4 h-4 mr-2" />
              {saving ? "SAVING..." : "SAVE ITEM"}
            </Button>
          </CardContent>
        </Card>

        {/* RECORDS TABLE */}
        <Card className="xl:col-span-8 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">INVENTORY RECORDS</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                <Package className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm tracking-wider">NO RECORDS FOUND</p>
                <p className="text-xs text-neutral-600 mt-1">Add a hardware item using the form</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-700 hover:bg-transparent">
                      <TableHead className="text-xs text-neutral-400 tracking-wider">CATEGORY</TableHead>
                      <TableHead className="text-xs text-neutral-400 tracking-wider">MODEL</TableHead>
                      <TableHead className="text-xs text-neutral-400 tracking-wider">SERVICE TAG</TableHead>
                      <TableHead className="text-xs text-neutral-400 tracking-wider">SERIAL/N</TableHead>
                      <TableHead className="text-xs text-neutral-400 tracking-wider">STATUS</TableHead>
                      <TableHead className="text-xs text-neutral-400 tracking-wider">DISPOSITION</TableHead>
                      <TableHead className="text-xs text-neutral-400 tracking-wider w-20 text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id} className="border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                        <TableCell className="text-sm text-neutral-300">
                          {getCategoryName(record.categoryId)}
                        </TableCell>
                        <TableCell className="text-sm text-white">{record.model}</TableCell>
                        <TableCell className="text-sm text-white font-mono">{record.serviceTag || "--"}</TableCell>
                        <TableCell className="text-sm text-white font-mono">{record.serialNumber || "--"}</TableCell>
                        <TableCell>
                          <Badge className={record.status === "Working" ? "bg-white/10 text-white" : "bg-red-500/20 text-red-500"}>
                            {record.status === "Working" ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                            {record.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={record.disposition === "Keep" ? "bg-orange-500/20 text-orange-500" : "bg-neutral-500/20 text-neutral-400"}>
                            {record.disposition === "Keep" ? <Archive className="w-3 h-3 mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
                            {record.disposition.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(record)} className="text-neutral-500 hover:text-white hover:bg-neutral-800 h-8 w-8">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            {user?.role === "Admin" && (
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id, record.categoryId)} className="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 h-8 w-8">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="tracking-wider">EDIT HARDWARE INFO</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-neutral-400 tracking-wider">CATEGORY</Label>
                <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white focus:border-orange-500">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                     {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-white">{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">MODEL</Label>
              <Input
                value={editModel}
                onChange={(e) => setEditModel(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-neutral-400 tracking-wider">SERVICE TAG</Label>
                <Input
                  value={editServiceTag}
                  onChange={(e) => setEditServiceTag(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-neutral-400 tracking-wider">SERIAL NUMBER</Label>
                <Input
                  value={editSerialNumber}
                  onChange={(e) => setEditSerialNumber(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white font-mono"
                />
              </div>
            </div>

            <p className="text-xs text-neutral-500">Status and Disposition are managed via logging/processing mechanisms.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingRecord(null)} className="text-neutral-400 hover:text-white">CANCEL</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit} className="bg-orange-500 hover:bg-orange-600 text-white tracking-wider">
              {savingEdit ? "SAVING..." : "SAVE CHANGES"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
