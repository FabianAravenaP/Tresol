"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface OfflineAction {
  id: string
  type: 'insert' | 'update'
  table: string
  data: any
  match?: any // For updates (e.g. { id: '...' })
  timestamp: number
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    // Check initial status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
      const queue = JSON.parse(localStorage.getItem("offline_queue") || "[]")
      setPendingCount(queue.length)

      const handleOnline = () => {
        setIsOnline(true)
        syncOfflineData()
      }
      const handleOffline = () => setIsOnline(false)

      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [])

  const updatePendingCount = () => {
    if (typeof window !== 'undefined') {
      const queue = JSON.parse(localStorage.getItem("offline_queue") || "[]")
      setPendingCount(queue.length)
    }
  }

  const addToOfflineQueue = (table: string, data: any, type: 'insert' | 'update' = 'insert', match?: any) => {
    if (typeof window !== 'undefined') {
      const queue: OfflineAction[] = JSON.parse(localStorage.getItem("offline_queue") || "[]")
      const newAction: OfflineAction = {
        id: crypto.randomUUID(),
        type,
        table,
        data,
        match,
        timestamp: Date.now()
      }
      localStorage.setItem("offline_queue", JSON.stringify([...queue, newAction]))
      setPendingCount(queue.length + 1)
    }
  }

  const syncOfflineData = async () => {
    if (typeof window === 'undefined') return
    
    const queue: OfflineAction[] = JSON.parse(localStorage.getItem("offline_queue") || "[]")
    if (queue.length === 0) return

    console.log(`📡 Sincronizando ${queue.length} acciones pendientes...`)

    const remainingQueue: OfflineAction[] = []

    for (const action of queue) {
      try {
        let error
        if (action.type === 'insert') {
          const res = await supabase.from(action.table).insert([action.data])
          error = res.error
        } else if (action.type === 'update') {
          const res = await supabase.from(action.table).update(action.data).match(action.match)
          error = res.error
        }

        if (error) {
          console.error(`❌ Error sincronizando acción ${action.id}:`, error)
          remainingQueue.push(action)
        }
      } catch (err) {
        console.error(`❌ Fallo crítico al sincronizar ${action.id}:`, err)
        remainingQueue.push(action)
      }
    }

    localStorage.setItem("offline_queue", JSON.stringify(remainingQueue))
    setPendingCount(remainingQueue.length)
  }

  return {
    isOnline,
    pendingCount,
    addToOfflineQueue,
    syncOfflineData
  }
}
