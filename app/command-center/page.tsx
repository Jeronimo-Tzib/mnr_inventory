"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useInventory } from "../inventory-context"
import { Package, CheckCircle, XCircle, Trash2, Activity, HardDrive } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

export default function CommandCenterPage() {
  const { records, activityLog, stats } = useInventory()

  // Aggregate status counts grouped by model for the bar chart
  const barData = useMemo(() => {
    const modelMap: Record<string, { model: string; Working: number; "Not Working": number }> = {}
    records.forEach((r) => {
      if (!modelMap[r.model]) {
        modelMap[r.model] = { model: r.model, Working: 0, "Not Working": 0 }
      }
      modelMap[r.model][r.status]++
    })
    return Object.values(modelMap)
  }, [records])

  // Disposition pie data
  const pieData = useMemo(() => {
    return [
      { name: "Keep", value: stats.keepItems },
      { name: "Discard", value: stats.discardItems },
    ].filter((d) => d.value > 0)
  }, [stats.keepItems, stats.discardItems])

  const PIE_COLORS = ["#f97316", "#737373"]

  // Recent 10 activity entries
  const recentActivity = activityLog.slice(0, 10)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">DASHBOARD</h1>
          <p className="text-sm text-neutral-400">Inventory analytics and system overview</p>
        </div>
        <Badge className="bg-orange-500/20 text-orange-500 text-xs tracking-wider">
          {stats.totalItems} ASSETS TRACKED
        </Badge>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL ITEMS</p>
                <p className="text-2xl font-bold text-white font-mono">{stats.totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-neutral-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">WORKING</p>
                <p className="text-2xl font-bold text-white font-mono">{stats.workingItems}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">NOT WORKING</p>
                <p className="text-2xl font-bold text-red-500 font-mono">{stats.notWorkingItems}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TO DISCARD</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">{stats.discardItems}</p>
              </div>
              <Trash2 className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status by Model Bar Chart */}
        <Card className="lg:col-span-8 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              STATUS BREAKDOWN BY MODEL
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                <HardDrive className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm tracking-wider">NO DATA AVAILABLE</p>
                <p className="text-xs text-neutral-600 mt-1">Add items in the Inventory section</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis
                    dataKey="model"
                    tick={{ fill: "#a3a3a3", fontSize: 11, fontFamily: "monospace" }}
                    axisLine={{ stroke: "#525252" }}
                    tickLine={{ stroke: "#525252" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: "#a3a3a3", fontSize: 11, fontFamily: "monospace" }}
                    axisLine={{ stroke: "#525252" }}
                    tickLine={{ stroke: "#525252" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#262626",
                      border: "1px solid #404040",
                      borderRadius: "4px",
                      color: "#ffffff",
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="Working" fill="#ffffff" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Not Working" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Disposition Pie Chart */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              DISPOSITION BREAKDOWN
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                <Package className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm tracking-wider">NO DATA</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value: string) => (
                      <span style={{ color: "#a3a3a3", fontSize: "11px", fontFamily: "monospace" }}>
                        {value.toUpperCase()}
                      </span>
                    )}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#262626",
                      border: "1px solid #404040",
                      borderRadius: "4px",
                      color: "#ffffff",
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            RECENT ACTIVITY
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <Activity className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm tracking-wider">NO ACTIVITY YET</p>
              <p className="text-xs text-neutral-600 mt-1">Inventory changes will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="text-xs border-l-2 border-orange-500 pl-3 p-2 rounded hover:bg-neutral-800 transition-colors"
                >
                  <div className="text-neutral-500 font-mono">{entry.timestamp}</div>
                  <div className="text-white flex items-center gap-2 flex-wrap mt-1">
                    <Badge
                      className={
                        entry.action === "added"
                          ? "bg-white/10 text-white text-[10px]"
                          : "bg-red-500/20 text-red-500 text-[10px]"
                      }
                    >
                      {entry.action.toUpperCase()}
                    </Badge>
                    <span>
                      <span className="text-orange-500 font-mono">{entry.itemModel}</span>
                      {" "}[<span className="font-mono">{entry.itemServiceTag}</span>]
                      {" "}&mdash; Status: <span className={entry.itemStatus === "Working" ? "text-white" : "text-red-500"}>{entry.itemStatus}</span>,
                      {" "}Disposition: <span className="text-orange-500">{entry.itemDisposition}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
