"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { User as UserIcon, Settings, LogOut, UserCircle, Activity, ChevronDown, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserProfileProps {
  variant?: "sidebar" | "header" | "dashboard"
  className?: string
}

export function UserProfile({ variant = "sidebar", className }: UserProfileProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const sessionStr = localStorage.getItem('tresol_session')
    if (sessionStr) {
      try {
        setUser(JSON.parse(sessionStr))
      } catch (e) {
        console.error("Error parsing session", e)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('tresol_session')
    window.location.href = '/'
  }

  if (!user) return null

  const initials = user.nombre
    ? user.nombre.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : "U"

  const getShortName = (fullName: string) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return fullName;
    // For 4 names (N1 N2 A1 A2), we take N1 and A1 (index 0 and 2)
    if (parts.length >= 4) return `${parts[0]} ${parts[2]}`;
    // For 2 or 3 names, we take the first and the second (assuming N1 A1 A2 or N1 A1)
    return `${parts[0]} ${parts[1]}`;
  };

  return (
    <div className={cn("relative", className)}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 transition-all rounded-2xl p-2 w-full text-left",
          variant === "dashboard" ? "hover:bg-white/50 dark:hover:bg-zinc-800/50" : "hover:bg-slate-50 dark:hover:bg-zinc-800",
          isOpen && (variant === "dashboard" ? "bg-white/50" : "bg-slate-50 dark:hover:bg-zinc-800")
        )}
      >
        <div className={cn(
          "rounded-xl flex items-center justify-center font-black shadow-inner border shrink-0",
          variant === "header" ? "size-10 bg-[#116CA2]/10 text-[#116CA2] border-[#116CA2]/20" : 
          variant === "dashboard" ? "size-9 bg-[#116CA2]/10 text-[#116CA2] border-[#116CA2]/10" :
          "size-12 bg-[#51872E]/10 text-[#51872E] border-[#51872E]/20 text-lg"
        )}>
          {initials}
        </div>
        
        <div className={cn("min-w-0", variant === "header" ? "hidden sm:block flex-1" : "flex-1")}>
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              "font-black text-[#323232] dark:text-white truncate uppercase tracking-tight",
              variant === "dashboard" ? "text-[11px]" : "text-sm"
            )}>
              {user.nombre}
            </p>
            <ChevronDown className={cn("size-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {variant === "dashboard" && user.rol === 'chofer' && (
               <div className="size-1 rounded-full bg-emerald-500 animate-pulse" />
            )}
            <p className={cn(
              "font-bold text-slate-400 uppercase tracking-[0.2em]",
              variant === "dashboard" ? "text-[8px]" : "text-[10px]"
            )}>
              {user.rol === 'chofer' ? (variant === "dashboard" ? 'CONDUCTOR ACTIVO' : 'CONDUCTOR') : user.rol}
            </p>
          </div>
        </div>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)} 
          />
          <div className={cn(
            "absolute z-40 w-64 bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-zinc-800 p-2 animate-in fade-in zoom-in-95 duration-200",
            variant === "header" ? "top-full right-0 mt-2" : 
            variant === "dashboard" ? "top-full left-0 mt-2" :
            "bottom-full left-0 mb-2"
          )}>
            <div className="px-4 py-3 border-b border-slate-50 dark:border-zinc-800 mb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cuenta</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{getShortName(user.nombre)}</p>
            </div>
            
            <div className="space-y-1">
              <MenuButton icon={UserCircle} label="Mi Perfil" />
              {user.rol === 'chofer' && (
                <MenuButton 
                  icon={Wallet} 
                  label="Mi Billetera" 
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/mobile/billetera')
                  }}
                />
              )}
              <MenuButton icon={Settings} label="Configuración" />
              <MenuButton icon={Activity} label="Mi Actividad" />
              <div className="h-px bg-slate-50 dark:bg-zinc-800 my-1" />
              <MenuButton 
                icon={UserCircle} 
                label="Contactar Soporte" 
                onClick={() => window.open('https://wa.me/56900000000', '_blank')} 
              />
              <div className="h-px bg-slate-50 dark:bg-zinc-800 my-1" />
              <MenuButton 
                icon={LogOut} 
                label="Cerrar Sesión" 
                variant="danger" 
                onClick={handleLogout}
              />
            </div>
            
            <div className="mt-2 px-4 py-2 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                 Soporte Técnico: <span className="text-[#51872E]">Ing. Fabian Aravena</span>
               </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MenuButton({ icon: Icon, label, onClick, variant = "default" }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all",
        variant === "danger" 
          ? "text-red-500 hover:bg-red-50" 
          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}