"use client"

import { useOfflineSync } from "@/hooks/useOfflineSync"
import { Badge } from "@/components/uib/badge"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export function ConnectionStatus() {
  const { isOnline, pendingCount, syncOfflineData } = useOfflineSync()

  return (
    <div className="flex items-center gap-1.5 md:gap-3">
      {/* 1. Network Status Badge */}
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full border-none shadow-none text-[7px] md:text-[9px] font-black uppercase tracking-widest transition-all h-7 md:h-8",
          isOnline 
            ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" 
            : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 animate-pulse"
        )}
      >
        <div className={cn(
          "size-1.5 rounded-full",
          isOnline 
            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
            : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
        )} />
        <span className="hidden xs:inline">{isOnline ? 'Online' : 'Offline'}</span>
      </Badge>
      
      {/* 2. Pending Sync Button */}
      {pendingCount > 0 && (
        <button 
          onClick={() => isOnline && syncOfflineData()}
          disabled={!isOnline}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-wider transition-all shadow-sm h-7 md:h-8",
            isOnline 
              ? "bg-[#116CA2] text-white hover:bg-[#0d5682] active:scale-95" 
              : "bg-amber-100 text-amber-700 border border-amber-200 opacity-60 cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("w-2.5 h-2.5 md:w-3 md:h-3", isOnline && "animate-spin-slow")} />
          <span>{pendingCount}</span>
          <span className="hidden sm:inline">Pendiente{pendingCount !== 1 ? 's' : ''}</span>
        </button>
      )}
    </div>
  )
}