"use client"

import { createContext, useContext, useCallback, type ReactNode } from "react"
import useSWR from "swr"

export interface InventoryRecord {
  id: string
  model: string
  serviceTag: string
  serialNumber?: string
  status: "Working" | "Not Working"
  problemDescription: string
  disposition: "Keep" | "Discard"
  categoryId?: string
  dateAdded: string
}

export interface HardwareCategory {
  id: string
  name: string
}

export interface HardwareModel {
  id: string
  name: string
  category_id: string
}

export interface ActivityLogEntry {
  id: string
  timestamp: string
  action: "added" | "deleted"
  itemModel: string
  itemServiceTag: string
  itemStatus: string
  itemDisposition: string
}

interface InventoryStats {
  totalItems: number
  workingItems: number
  notWorkingItems: number
  discardItems: number
  keepItems: number
}

interface InventoryContextValue {
  records: InventoryRecord[]
  activityLog: ActivityLogEntry[]
  categories: HardwareCategory[]
  models: HardwareModel[]
  stats: InventoryStats
  addRecord: (record: Omit<InventoryRecord, "id" | "dateAdded">) => Promise<void>
  editRecord: (id: string, updates: { model: string; serviceTag?: string; serialNumber?: string; categoryId?: string }) => Promise<void>
  deleteRecord: (id: string, categoryId: string) => Promise<void>
  isLoading: boolean
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function InventoryProvider({ children }: { children: ReactNode }) {
  const {
    data: records = [],
    mutate: mutateRecords,
    isLoading: recordsLoading,
  } = useSWR<InventoryRecord[]>("/api/inventory", fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  const {
    data: activityLog = [],
    mutate: mutateLog,
    isLoading: logLoading,
  } = useSWR<ActivityLogEntry[]>("/api/activity-log", fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  const {
    data: categories = [],
    mutate: mutateCategories,
    isLoading: categoriesLoading,
  } = useSWR<HardwareCategory[]>("/api/categories", fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  // We fetch all models globally for the combobox. We could also filter by selected category query param later.
  const {
    data: models = [],
    mutate: mutateModels,
    isLoading: modelsLoading,
  } = useSWR<HardwareModel[]>("/api/models", fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  const stats: InventoryStats = {
    totalItems: records.length,
    workingItems: records.filter((r) => r.status === "Working").length,
    notWorkingItems: records.filter((r) => r.status === "Not Working").length,
    discardItems: records.filter((r) => r.disposition === "Discard").length,
    keepItems: records.filter((r) => r.disposition === "Keep").length,
  }

  const addRecord = useCallback(
    async (data: Omit<InventoryRecord, "id" | "dateAdded">) => {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to add record")
      }

      // Revalidate all caches to get the latest DB state including category resolution and models
      await Promise.all([mutateRecords(), mutateLog(), mutateModels()])
    },
    [mutateRecords, mutateLog, mutateModels],
  )

  const editRecord = useCallback(
    async (id: string, updates: { model: string; serviceTag?: string; serialNumber?: string; categoryId?: string }) => {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to edit record")
      }

      // Revalidate caches
      await Promise.all([mutateRecords(), mutateLog(), mutateModels()])
    },
    [mutateRecords, mutateLog, mutateModels],
  )

  const deleteRecord = useCallback(
    async (id: string, categoryId: string) => {
      const res = await fetch(`/api/inventory/${id}?categoryId=${categoryId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete record")
      }

      // Revalidate both caches
      await Promise.all([mutateRecords(), mutateLog()])
    },
    [mutateRecords, mutateLog],
  )

  return (
    <InventoryContext.Provider
      value={{ records, activityLog, categories, models, stats, addRecord, editRecord, deleteRecord, isLoading: recordsLoading || logLoading || categoriesLoading || modelsLoading }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory(): InventoryContextValue {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider")
  }
  return context
}
