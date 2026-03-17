"use client"

import { useState } from "react"
import { ChevronRight, Monitor, Shield, Bell, RefreshCw, HardDrive, LogOut, User as UserIcon, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InventoryProvider, useInventory } from "./inventory-context"
import { useAuth } from "./auth-context"
import CommandCenterPage from "./command-center/page"
import IntelligencePage from "./intelligence/page"
import InventoryPage from "./inventory/page"
import CategoriesPage from "./categories/page"
import TagPrinterPage from "./tag-printer/page"

const NAV_ITEMS = [
  { id: "overview", icon: Monitor, label: "DASHBOARD" },
  { id: "inventory", icon: HardDrive, label: "INVENTORY" },
  { id: "intelligence", icon: Shield, label: "SYSTEM LOGS" },
  { id: "categories", icon: RefreshCw, label: "CATEGORIES" },
  { id: "tag-printer", icon: Tag, label: "TAG PRINTER" },
] as const

const SECTION_LABELS: Record<string, string> = {
  overview: "DASHBOARD",
  inventory: "INVENTORY",
  intelligence: "SYSTEM LOGS",
  categories: "CATEGORIES",
  "tag-printer": "TAG PRINTER",
}

function DashboardShell() {
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { stats } = useInventory()
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen print:h-auto print:block">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""} print:hidden`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-orange-500 font-bold text-lg tracking-wider">MNR INV.</h1>
              <p className="text-neutral-500 text-xs">INVENTORY COMMAND</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-orange-500"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              if (item.id === "categories" && user?.role !== "Admin") return null
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${activeSection === item.id
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                >
                  <item.icon className="w-5 h-5 md:w-5 md:h-5 sm:w-6 sm:h-6" />
                  {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              )
            })}
          </nav>

          {!sidebarCollapsed && user && (
            <div className="mt-8 pt-4 border-t border-neutral-800">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-3 py-2 bg-neutral-800/50 rounded-md">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-white font-medium capitalize">{user.username}</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{user.role}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="w-full flex items-center justify-start gap-3 p-3 text-neutral-400 hover:text-red-500 hover:bg-neutral-800"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">LOGOUT</span>
                </Button>
              </div>
            </div>
          )}

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs text-white">SYSTEM ONLINE</span>
              </div>
              <div className="text-xs text-neutral-500 space-y-0.5">
                <div>TOTAL ITEMS: <span className="text-white font-mono">{stats.totalItems}</span></div>
                <div>WORKING: <span className="text-white font-mono">{stats.workingItems}</span></div>
                <div>NOT WORKING: <span className="text-red-500 font-mono">{stats.notWorkingItems}</span></div>
                <div>TO DISCARD: <span className="text-orange-500 font-mono">{stats.discardItems}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden print:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${!sidebarCollapsed ? "md:ml-0" : ""} print:block print:w-full print:m-0 print:p-0`}>
        {/* Top Toolbar */}
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6 print:hidden">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              MNR INV. / <span className="text-orange-500">{SECTION_LABELS[activeSection] || "OVERVIEW"}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="Stext-xs text-neutral-500 hidden sm:block">
              ASSETS: <span className="text-white font-mono">{stats.totalItems}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto print:overflow-visible print:h-auto print:block print:p-0 print:m-0">
          {activeSection === "overview" && <CommandCenterPage />}
          {activeSection === "inventory" && <InventoryPage />}
          {activeSection === "intelligence" && <IntelligencePage />}
          {activeSection === "categories" && <CategoriesPage />}
          {activeSection === "tag-printer" && <TagPrinterPage />}
        </div>
      </div>
    </div>
  )
}

export default function TacticalDashboard() {
  return (
    <InventoryProvider>
      <DashboardShell />
    </InventoryProvider>
  )
}
