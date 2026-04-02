"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/uib/button"
import { ConnectionStatus } from "@/components/ConnectionStatus"
import { 
  Users, 
  Truck, 
  Settings, 
  LayoutDashboard, 
  MapPin, 
  ShieldCheck,
  ChevronRight,
  Activity,
  Home,
  Menu,
  X,
  FileText,
  Smartphone,
  Plus,
  Package,
  Utensils,
  ChefHat,
  Car
} from "lucide-react"
import { UserProfile } from "@/components/UserProfile"
import { supabase } from "@/lib/supabase"
import { SidebarCustomizer } from "@/components/SidebarCustomizer"
import { ALL_MODULES } from "@/lib/modules"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [quickAccess, setQuickAccess] = useState<any[]>([])
  const [isCustomizing, setIsCustomizing] = useState(false)

  // Icons mapping for dynamic icons from JSON
  const IconMap: any = { 
    LayoutDashboard, MapPin, Activity, Users, Truck, Settings, 
    Home, ShieldCheck, Smartphone, FileText, Utensils, ChefHat, Package, Car 
  }

  useEffect(() => {
    const sessionStr = localStorage.getItem('tresol_session')
    if (sessionStr) {
      try {
        const sessionUser = JSON.parse(sessionStr)
        setUser(sessionUser)
        fetchUserConfig(sessionUser.id)
      } catch (e) {
        console.error("Error parsing session", e)
      }
    }
  }, [])

  const fetchUserConfig = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('config_sidebar')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      if (data?.config_sidebar && Array.isArray(data.config_sidebar) && data.config_sidebar.length > 0) {
        setQuickAccess(data.config_sidebar)
      } else {
        // Fallback or default
        setQuickAccess(ALL_MODULES.filter(m => 
          ["operativo", "cocina", "activos", "porteria", "digitalizador"].includes(m.id)
        ))
      }
    } catch (err) {
      console.error("Error fetching user config", err)
    }
  }

  const handleSaveConfig = async (newConfig: any[]) => {
    if (!user) {
      console.error("No user found for saving config")
      return
    }
    console.log("Saving new config for user:", user.id, newConfig)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'usuarios',
          method: 'update',
          data: { config_sidebar: newConfig },
          match: { id: user.id }
        })
      })
      const { success, error } = await res.json()
      
      if (error) {
        console.error("Proxy update error:", error)
        throw new Error(error)
      }
      
      console.log("Update success via proxy")
      setQuickAccess(newConfig)
      
      // Update local session to persist changes immediately
      const newSession = { ...user, config_sidebar: newConfig }
      localStorage.setItem('tresol_session', JSON.stringify(newSession))
      setUser(newSession)
      
      setIsCustomizing(false)
    } catch (err) {
      console.error("Error updating config detail:", err)
      alert("Error al guardar configuración. Revisa la consola.")
    }
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Préstamo Vehículo", href: "/admin/prestamos", icon: Car },
    { name: "Gestión Cocina", href: "/cocina", icon: Utensils, roles: ['master_admin', 'admin', 'cocina'] },
    { name: "Analíticas", href: "/admin/analiticas", icon: Activity, roles: ['master_admin', 'admin'] },
    { name: "Usuarios", href: "/admin/usuarios", icon: Users, roles: ['master_admin'] },
    { name: "Flota", href: "/admin/flota", icon: Truck, roles: ['master_admin', 'admin'] },
    { name: "Personal", href: "/admin/personal", icon: Users, roles: ['master_admin', 'admin'] },
    { name: "Vehículos Menores", href: "/admin/vehiculos_menores", icon: Car, roles: ['master_admin', 'admin'] },
    { name: "Clientes", href: "/admin/clientes", icon: MapPin, roles: ['master_admin', 'admin'] },
    { name: "Configuración", href: "/admin/config", icon: Settings, roles: ['master_admin'] },
  ]

  // Sidebar is persistent for admin-level and general dashboard users
  const showSidebar = user && ['master_admin', 'admin', 'operaciones', 'usuario'].includes(user.rol)

  // If sidebar is shown, filter nav items
  const filteredNavItems = navItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.rol))
  )

  // Page title based on path
  const currentNavItem = navItems.find(i => pathname.startsWith(i.href))
  let pageTitle = "Dashboard"
  if (pathname.includes('/operaciones')) pageTitle = "Operaciones"
  else if (pathname.includes('/porteria')) pageTitle = "Portería"
  else if (pathname.includes('/activos')) pageTitle = "Gestión de Activos"
  else if (pathname.includes('/digitalizador')) pageTitle = "Digitalizador"
  else if (currentNavItem) pageTitle = currentNavItem.name

  if (!user) return <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center font-bold italic text-slate-400">Iniciando sesión segura...</div>

  // If the user doesn't have a role that shows the sidebar, just render children directly (full screen)
  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-zinc-950 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="w-72 border-r bg-white dark:bg-zinc-900 hidden md:flex flex-col flex-shrink-0 shadow-xl z-20">
        <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-zinc-800">
           <div className="flex items-center gap-3">
              <div className="bg-[#116CA2] p-2 rounded-xl text-white shadow-lg shadow-[#116CA2]/20">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-[#116CA2] tracking-[0.2em] leading-none mb-1">Tresol ERP</p>
                <h2 className="text-sm font-black text-[#323232] dark:text-white uppercase tracking-tighter">
                  {user.rol === 'master_admin' ? 'Admin Maestro' : 'Administrador'}
                </h2>
              </div>
           </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Gestión General</p>
          {filteredNavItems.map((item) => {
            const isActive = item.href === '/admin' 
              ? pathname === '/admin' 
              : (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
            const isOperaciones = item.href === '/operaciones' && pathname.startsWith('/operaciones')
            
            return (
              <div key={item.href} className="space-y-1">
                <Link 
                  href={item.href} 
                  className={cn(
                    "flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold transition-all text-sm group",
                    isActive 
                      ? "bg-[#116CA2] text-white shadow-lg shadow-[#116CA2]/20" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-[#116CA2] dark:hover:bg-zinc-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("size-5 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-[#116CA2]")} />
                    {item.name}
                  </div>
                  {isActive && <ChevronRight className="size-4 animate-in slide-in-from-left-2" />}
                </Link>

                {/* Sub-menu for Operaciones */}
                {isOperaciones && (
                  <div className="ml-9 pl-4 border-l-2 border-slate-100 dark:border-zinc-800 space-y-1 py-2 animate-in slide-in-from-top-2 duration-300">
                    {[
                      { name: "Planificación", href: "/operaciones" },
                      { name: "Historial", href: "/operaciones/servicios" },
                      { name: "Flota", href: "/operaciones/flota" },
                      { name: "Pagos", href: "/operaciones/pagos" },
                    ].map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "block py-2 text-[11px] font-black uppercase tracking-widest transition-colors",
                          pathname === subItem.href 
                            ? "text-[#116CA2] dark:text-blue-400" 
                            : "text-slate-400 hover:text-[#116CA2]"
                        )}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <div className="pt-8 space-y-2">
            <div className="flex items-center justify-between px-4 mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Accesos Rápidos</p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-6 rounded-lg text-slate-300 hover:text-[#116CA2] hover:bg-[#116CA2]/5 transition-all"
                onClick={() => setIsCustomizing(true)}
              >
                 <Settings className="size-3" />
              </Button>
            </div>

            {quickAccess.length === 0 && (
              <div className="px-4 py-4 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase italic">Sin accesos directos</p>
              </div>
            )}

            {quickAccess.map((item) => {
              const DynamicIcon = item.icon ? IconMap[item.icon] : null

              if (item.type === 'portal') {
                return (
                  <Link key={item.id} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-slate-500 hover:bg-[#116CA2]/5 hover:text-[#116CA2] transition-all text-sm group">
                    <div className="size-6 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#116CA2]/10 transition-colors">
                      <Home className="size-3.5" />
                    </div>
                    {item.name}
                  </Link>
                )
              }

              if (item.type === 'status') {
                const isGroupActive = pathname.includes(item.href)
                return (
                  <Link key={item.id} href={item.href} className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm",
                    isGroupActive ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                  )}>
                    <div className={cn("size-2 rounded-full", isGroupActive ? "scale-125" : "", item.color || "bg-slate-400")} />
                    {item.name}
                  </Link>
                )
              }

              if (item.type === 'icon') {
                const isLinkActive = pathname === item.href
                return (
                  <Link key={item.id} href={item.href} className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm",
                    isLinkActive ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                  )}>
                    {DynamicIcon && <DynamicIcon className="size-4" />}
                    {item.name}
                  </Link>
                )
              }
              return null
            })}
          </div>
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-zinc-800 flex flex-col gap-1">
           <div className="pt-2 flex flex-col gap-1 opacity-60">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Desarrollo & Asesoría</p>
              <p className="text-[10px] font-black text-[#51872E] uppercase tracking-widest">Fabian Aravena</p>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Ing. Civil Industrial</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between px-10 bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="size-6" />
            </Button>
            <h1 className="font-black text-xl text-[#323232] dark:text-white uppercase tracking-tight">
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <ConnectionStatus />
            <div className="h-10 w-[1px] bg-slate-100 dark:bg-zinc-800" />
            <UserProfile variant="header" />
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#FFF9F0]/30 dark:bg-black/20">
          {children}
        </div>
      </main>

      <SidebarCustomizer 
        isOpen={isCustomizing} 
        onClose={() => setIsCustomizing(false)} 
        currentConfig={quickAccess}
        onSave={handleSaveConfig}
      />
    </div>
  )
}