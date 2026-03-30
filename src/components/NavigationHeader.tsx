"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Home, UserCircle, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectionStatus } from "@/components/ConnectionStatus"
import { UserProfile } from "@/components/UserProfile"
import { cn } from "@/lib/utils"

interface NavigationHeaderProps {
  title: string
  subtitle?: string
  className?: string
  hideProfile?: boolean
  showBack?: boolean
}

export function NavigationHeader({ 
  title, 
  subtitle, 
  className, 
  hideProfile = false,
  showBack = false 
}: NavigationHeaderProps) {
  const router = useRouter()
  const [isInDashboard, setIsInDashboard] = useState(false)

  useEffect(() => {
    // Check if we are inside the (dashboard) route group layout for an admin
    const sessionStr = localStorage.getItem('tresol_session')
    if (sessionStr) {
      try {
        const user = JSON.parse(sessionStr)
        if (user.rol === 'master_admin' || user.rol === 'admin') {
          setIsInDashboard(true)
        }
      } catch (e) {}
    }
  }, [])

  // If we are in the dashboard, the main DashboardLayout already provides a header
  if (isInDashboard) return null

  return (
    <header className={cn(
      "h-16 w-full border-b border-white/10 dark:border-white/5 bg-white/70 backdrop-blur-2xl dark:bg-zinc-950/70 sticky top-0 z-[60] px-3 grid grid-cols-[40px_1fr_auto] items-center gap-2",
      className
    )}>
      {/* 1. Back Button - Fixed Slot */}
      <div className="flex items-center justify-center">
        {showBack && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="rounded-xl h-9 w-9 shrink-0 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="size-5" />
          </Button>
        )}
      </div>

      {/* 2. Logo & Titles - Expandable & Truncated */}
      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
        <Link href="/" className="flex items-center shrink-0">
          <div className="p-1 px-1.5 bg-white rounded-lg shadow-sm ring-1 ring-black/5">
            <img 
              src="https://tresol.cl/es/wp-content/uploads/2025/05/Recurso-5Logo-oficial-de-tresol.svg" 
              alt="Tresol" 
              className="h-4 w-auto object-contain"
            />
          </div>
        </Link>
        <div className="flex flex-col min-w-0 flex-1">
          <h1 className="font-black text-[10px] md:text-sm text-[#1e1e1e] dark:text-white uppercase tracking-wider leading-none italic truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[7px] md:text-[10px] font-black text-primary uppercase tracking-[0.1em] mt-0.5 opacity-70 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* 3. Connection Status & Profile - Fixed Right Slot */}
      <div className="flex items-center gap-2 shrink-0 justify-end h-full">
        <ConnectionStatus />
        {!hideProfile && (
          <div className="hidden lg:block ml-2 border-l pl-3 border-black/5 h-8 self-center">
             <UserProfile variant="header" />
          </div>
        )}
      </div>
    </header>
  )
}
