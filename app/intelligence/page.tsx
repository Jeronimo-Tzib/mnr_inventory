"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useInventory } from "../inventory-context"
import { Search, FileText, Activity, Clock, CheckCircle, XCircle, Archive, Trash2 } from "lucide-react"

export default function IntelligencePage() {
  const { records, activityLog, stats } = useInventory()
  const [searchTerm, setSearchTerm] = useState("")

  const lowerSearch = searchTerm.toLowerCase()

  // Filter activity log
  const filteredLog = useMemo(() => {
    if (!searchTerm) return activityLog
    return activityLog.filter(
      (entry) =>
        (entry.itemModel || "").toLowerCase().includes(lowerSearch) ||
        (entry.itemServiceTag || "").toLowerCase().includes(lowerSearch) ||
        (entry.itemStatus || "").toLowerCase().includes(lowerSearch) ||
        (entry.itemDisposition || "").toLowerCase().includes(lowerSearch) ||
        (entry.action || "").toLowerCase().includes(lowerSearch),
    )
  }, [activityLog, lowerSearch, searchTerm])

  // Filter records table
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records
    return records.filter(
      (r) =>
        (r.model || "").toLowerCase().includes(lowerSearch) ||
        (r.serviceTag || "").toLowerCase().includes(lowerSearch) ||
        (r.serialNumber || "").toLowerCase().includes(lowerSearch) ||
        (r.status || "").toLowerCase().includes(lowerSearch) ||
        (r.disposition || "").toLowerCase().includes(lowerSearch) ||
        (r.problemDescription || "").toLowerCase().includes(lowerSearch),
    )
  }, [records, lowerSearch, searchTerm])

  // Latest activity timestamp
  const latestTimestamp = activityLog.length > 0 ? activityLog[0].timestamp : "N/A"

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">HARDWARE LOGS</h1>
          <p className="text-sm text-neutral-400">Inventory activity logs and records search</p>
        </div>
      </div>

      {/* Stats + Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search logs and records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">LOG ENTRIES</p>
                <p className="text-2xl font-bold text-white font-mono">{activityLog.length}</p>
              </div>
              <FileText className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ITEMS TRACKED</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">{stats.totalItems}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">LATEST ACTIVITY</p>
                <p className="text-sm font-bold text-white font-mono truncate">{latestTimestamp}</p>
              </div>
              <Clock className="w-8 h-8 text-neutral-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log Feed */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              ACTIVITY LOG
            </CardTitle>
            {searchTerm && (
              <Badge className="bg-orange-500/20 text-orange-500 text-[10px]">
                {filteredLog.length} MATCH{filteredLog.length !== 1 ? "ES" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <Activity className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm tracking-wider">
                {searchTerm ? "NO MATCHING LOG ENTRIES" : "NO ACTIVITY YET"}
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                {searchTerm ? "Try adjusting your search term" : "Add inventory items to generate logs"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLog.map((entry) => (
                <div
                  key={entry.id}
                  className="text-xs border-l-2 border-orange-500 pl-3 p-2 rounded hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-neutral-500 font-mono">{entry.timestamp}</span>
                    <Badge
                      className={
                        entry.action === "added"
                          ? "bg-white/10 text-white text-[10px]"
                          : "bg-red-500/20 text-red-500 text-[10px]"
                      }
                    >
                      {entry.action.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-white">
                    <span className="text-orange-500 font-mono">{entry.itemModel}</span>
                    {" "}[<span className="font-mono">{entry.itemServiceTag}</span>]
                    {" "}&mdash; Status:{" "}
                    <span className={entry.itemStatus === "Working" ? "text-white" : "text-red-500"}>
                      {entry.itemStatus}
                    </span>
                    , Disposition:{" "}
                    <span className="text-orange-500">{entry.itemDisposition}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Searchable Records Table */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              INVENTORY RECORDS
            </CardTitle>
            {searchTerm && (
              <Badge className="bg-orange-500/20 text-orange-500 text-[10px]">
                {filteredRecords.length} RECORD{filteredRecords.length !== 1 ? "S" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <FileText className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm tracking-wider">
                {searchTerm ? "NO MATCHING RECORDS" : "NO RECORDS FOUND"}
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                {searchTerm ? "Try adjusting your search term" : "Add items via the Inventory section"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-700 hover:bg-transparent">
                    <TableHead className="text-xs text-neutral-400 tracking-wider">MODEL</TableHead>
                    <TableHead className="text-xs text-neutral-400 tracking-wider">TAG / S/N</TableHead>
                    <TableHead className="text-xs text-neutral-400 tracking-wider">STATUS</TableHead>
                    <TableHead className="text-xs text-neutral-400 tracking-wider">PROBLEM</TableHead>
                    <TableHead className="text-xs text-neutral-400 tracking-wider">DISPOSITION</TableHead>
                    <TableHead className="text-xs text-neutral-400 tracking-wider">DATE ADDED</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      className="border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                    >
                      <TableCell className="text-sm text-white">{record.model}</TableCell>
                      <TableCell className="text-sm text-white font-mono">{record.serviceTag || record.serialNumber || "--"}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            record.status === "Working"
                              ? "bg-white/10 text-white"
                              : "bg-red-500/20 text-red-500"
                          }
                        >
                          {record.status === "Working" ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {record.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-400 max-w-[200px] truncate">
                        {record.problemDescription || <span className="text-neutral-600">--</span>}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            record.disposition === "Keep"
                              ? "bg-orange-500/20 text-orange-500"
                              : "bg-neutral-500/20 text-neutral-400"
                          }
                        >
                          {record.disposition === "Keep" ? (
                            <Archive className="w-3 h-3 mr-1" />
                          ) : (
                            <Trash2 className="w-3 h-3 mr-1" />
                          )}
                          {record.disposition.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-neutral-400 font-mono whitespace-nowrap">
                        {record.dateAdded}
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
  )
}
