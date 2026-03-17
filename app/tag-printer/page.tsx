"use client"

import { useState, useMemo } from "react"
import { useInventory } from "../inventory-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Printer, Search, Tag } from "lucide-react"

export default function TagPrinterPage() {
  const { records, categories } = useInventory()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredRecords = useMemo(() => {
    return records.filter(record => 
      record.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.serviceTag && record.serviceTag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.serialNumber && record.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [records, searchTerm])

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)))
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getCategoryName = (cid?: string) => {
    if (!cid) return "--"
    const cat = categories.find(c => c.id === cid)
    return cat ? cat.name : "Unknown"
  }

  const selectedRecords = records.filter(r => selectedIds.has(r.id))

  return (
    <div className="flex h-full flex-col md:flex-row print:block print:h-auto print:w-full print:m-0 print:p-0">
      {/* UI Panel - Hidden on print */}
      <div className="w-full md:w-1/2 p-6 flex flex-col gap-6 border-r border-neutral-800 overflow-hidden h-full max-h-screen print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider">TAG PRINTER</h1>
            <p className="text-sm text-neutral-400">Select items to print 80x297mm tags</p>
          </div>
          <Button 
            onClick={handlePrint} 
            disabled={selectedIds.size === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white tracking-wider disabled:opacity-50"
          >
            <Printer className="w-4 h-4 mr-2" />
            PRINT ({selectedIds.size}) TAGS
          </Button>
        </div>

        <Card className="bg-neutral-900 border-neutral-700 flex-1 flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" />
                SELECT INVENTORY ITEMS
              </CardTitle>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by model, tag, S/N..." 
                className="pl-9 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-4 border-b border-neutral-800">
                <Checkbox 
                  id="select-all" 
                  checked={selectedIds.size === filteredRecords.length && filteredRecords.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="border-neutral-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <label htmlFor="select-all" className="text-sm font-medium text-neutral-300 cursor-pointer">
                  Select All Filtered ({filteredRecords.length})
                </label>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-sm tracking-wider">
                  <Tag className="w-8 h-8 mx-auto mb-2 opacity-30 text-neutral-500" />
                  NO ITEMS FOUND
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRecords.map(record => (
                    <div 
                      key={record.id} 
                      className={`flex items-start space-x-3 p-3 rounded-md border transition-colors cursor-pointer
                        ${selectedIds.has(record.id) ? 'bg-orange-500/10 border-orange-500/30' : 'bg-neutral-800/50 border-neutral-800 hover:bg-neutral-800'}
                      `}
                      onClick={() => handleToggleSelect(record.id)}
                    >
                      <Checkbox 
                        id={`item-${record.id}`} 
                        checked={selectedIds.has(record.id)}
                        onCheckedChange={() => handleToggleSelect(record.id)}
                        onClick={(e) => e.stopPropagation()} // Prevent double toggle
                        className="mt-1 border-neutral-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white truncate">{record.model}</p>
                          <Badge className={record.status === "Working" ? "bg-white/10 text-white text-[10px]" : "bg-red-500/20 text-red-500 text-[10px]"}>
                            {record.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400 font-mono flex-wrap">
                          {record.serviceTag && <span>TAG: {record.serviceTag}</span>}
                          {record.serviceTag && record.serialNumber && <span className="text-neutral-600">|</span>}
                          {record.serialNumber && <span>S/N: {record.serialNumber}</span>}
                          <span className="text-neutral-600 ml-auto">{getCategoryName(record.categoryId)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel - Visible both on screen and print */}
      <div className="w-full md:w-1/2 bg-neutral-950 p-6 overflow-auto border-l border-neutral-800 h-full max-h-screen print:w-full print:block print:h-auto print:overflow-visible print:p-0 print:m-0 print:border-none print:bg-white text-black">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <h2 className="text-sm font-medium text-neutral-500 tracking-wider">PRINT PREVIEW (80x297mm)</h2>
          <Badge variant="outline" className="border-neutral-700 text-neutral-400">
            {selectedRecords.length} tags selected
          </Badge>
        </div>
        
        {selectedRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-600 border-2 border-dashed border-neutral-800 rounded-lg bg-neutral-900/50">
             <Tag className="w-8 h-8 mb-2 opacity-30" />
             <p className="text-sm tracking-wider">SELECT ITEMS TO PREVIEW TAGS</p>
          </div>
        ) : (
          <div className="print-only-container flex flex-col items-center gap-8 pb-12">
            {selectedRecords.map((record, index) => (
              <div 
                key={`${record.id}-${index}`} 
                className="physical-tag bg-white text-black p-4 flex flex-col shadow-lg shadow-black/20"
                style={{ width: '80mm', height: 'auto' }}
              >
                <div className="text-center border-b-[2px] border-black pb-2 mb-3">
                  <h1 className="font-black text-xl tracking-widest uppercase">MNR INV.</h1>
                  <p className="text-[9px] font-bold tracking-widest mt-0.5">ASSET TRACKING TAG</p>
                </div>
                
                <div className="space-y-3 flex-1 w-full">
                  <div className="border-b border-gray-300 pb-2">
                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5 leading-none">Category</div>
                    <div className="font-black text-lg leading-tight uppercase tracking-wide">{getCategoryName(record.categoryId)}</div>
                  </div>
                  
                  <div className="border-b border-gray-300 pb-2">
                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5 leading-none">Model</div>
                    <div className="font-bold text-base leading-tight uppercase tabular-nums">
                      {record.model}
                    </div>
                  </div>
                  
                  {(record.serviceTag || record.serialNumber) && (
                    <div className="p-2 border-[2px] border-black rounded-lg bg-gray-50/50">
                      {record.serviceTag && (
                        <div className={record.serialNumber ? "mb-2" : ""}>
                          <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-none mb-0.5">Service Tag</div>
                          <div className="font-mono font-black text-base tracking-wider uppercase leading-none">{record.serviceTag}</div>
                        </div>
                      )}
                      {record.serialNumber && (
                        <div className={record.serviceTag ? "pt-2 border-t border-gray-300" : ""}>
                          <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-none mb-0.5">Serial Number</div>
                          <div className="font-mono font-black text-base tracking-wider uppercase leading-none">{record.serialNumber}</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center border-[2px] border-black px-2 py-1.5 rounded-lg bg-gray-50/50">
                    <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-none">Status</div>
                    <div className="font-black text-xs uppercase tracking-wide">{record.status}</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t-[2px] border-black text-[10px] text-black space-y-1 font-mono w-full">
                  <div className="flex bg-gray-100 px-1 py-0.5 rounded">
                    <span className="font-bold uppercase">ID: {record.id}</span>
                  </div>
                  <div className="flex justify-between px-1 text-[9px]">
                    <span className="text-gray-500 font-bold">ADD: {record.dateAdded.split(',')[0]}</span>
                    <span className="text-gray-500 font-bold">PRT: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
