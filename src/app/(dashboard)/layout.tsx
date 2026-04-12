"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  Package,
  Utensils,
  Car
} from "lucide-react"
import { UserProfile } from "@/components/UserProfile"
import { supabase } from "@/lib/supabase"
import { ALL_MODULES, parseSidebarConfig, getModuleHref, getModuleDisplayName, type SidebarEntry } from "@/lib/modules"

const IconMap: Record<string, React.ElementType> = {
  LayoutDashboard, MapPin, Activity, Users, Truck, Settings,
  Home, ShieldCheck, Smartphone, FileText, Utensils, Package, Car
}

/** Full admin access: master_admin role OR legacy keyword/RUT detection */
function isSuperUser(user: any): boolean {
  if (!user) return false
  if (user.rol === 'master_admin') return true
  const roleUp = (user.rol || '').toUpperCase()
  if (roleUp.includes('ADMIN') || roleUp.includes('GERENTE') || roleUp.includes('JEFE')) return true
  if (user.rut?.toString() === '17630469') return true
  return false
}

// Admin nav items — only shown to master_admin / super users
const ADMIN_NAV = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Préstamo Vehículo/Admin", href: "/prestamos", icon: Car },
  { name: "Cocina/Admin", href: "/cocina", icon: Utensils },
  { name: "Analíticas", href: "/admin/analiticas", icon: Activity },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users },
  { name: "Flota", href: "/admin/flota", icon: Truck },
  { name: "Personal", href: "/admin/personal", icon: Users },
  { name: "Vehículos Menores", href: "/admin/vehiculos_menores", icon: Car },
  { name: "Clientes", href: "/admin/clientes", icon: MapPin },
  { name: "Configuración", href: "/admin/config", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pendingPrestamos, setPendingPrestamos] = useState(0)

  // ── Load session + sync with DB ────────────────────────────────────────────
  useEffect(() => {
    const sessionStr = localStorage.getItem('tresol_session')
    if (!sessionStr) { router.push('/'); return }

    const sessionUser = JSON.parse(sessionStr)
    setUser(sessionUser)

    const syncProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', sessionUser.id)
          .single()

        if (!error && data) {
          const updated = { ...sessionUser, ...data }
          setUser(updated)
          localStorage.setItem('tresol_session', JSON.stringify(updated))
        }
      } catch { /* silent */ }
    }

    syncProfile()
  }, [router])

  // ── Route protection ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    if (isSuperUser(user)) return // full access

    const config: SidebarEntry[] = parseSidebarConfig(user.config_sidebar)

    // Build the set of allowed path prefixes for this user
    const allowed = ['/dashboard', ...config.map(e => getModuleHref(e.id, e.view))]

    const isAllowed = allowed.some(h => pathname === h || pathname.startsWith(h + '/'))
    if (!isAllowed) {
      router.replace('/dashboard')
    }
  }, [user, pathname, router])

  // ── Pending prestamos badge (admins only) ─────────────────────────────────
  useEffect(() => {
    if (!user || !isSuperUser(user)) return

    const fetchPending = async () => {
      try {
        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'solicitudes_vehiculos',
            method: 'select',
            data: 'id',
            match: { estado_solicitud: 'PENDIENTE' }
          })
        })
        const { data } = await res.json()
        setPendingPrestamos(Array.isArray(data) ? data.length : 0)
      } catch { /* silent */ }
    }

    fetchPending()
    const interval = setInterval(fetchPending, 60_000)
    return () => clearInterval(interval)
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center font-bold italic text-slate-400">
        Iniciando sesión segura...
      </div>
    )
  }

  const isMasterAdmin = isSuperUser(user)

  // Resolve sidebar modules for non-admin users
  const config: SidebarEntry[] = parseSidebarConfig(user.config_sidebar)
  const userSidebarModules = config
    .map(entry => {
      const mod = ALL_MODULES.find(m => m.id === entry.id)
      if (!mod) return null
      return { ...mod, href: getModuleHref(entry.id, entry.view), view: entry.view }
    })
    .filter(Boolean) as Array<typeof ALL_MODULES[0] & { view: string }>

  // Page title
  let pageTitle = "Mi Panel"
  if (pathname === '/dashboard') pageTitle = "Mi Panel"
  else if (pathname.startsWith('/admin/usuarios')) pageTitle = "Usuarios"
  else if (pathname.startsWith('/admin/analiticas')) pageTitle = "Analíticas"
  else if (pathname.startsWith('/admin/flota')) pageTitle = "Flota"
  else if (pathname.startsWith('/admin/personal')) pageTitle = "Personal"
  else if (pathname.startsWith('/admin/vehiculos_menores')) pageTitle = "Préstamo Vehículo/Admin"
  else if (pathname.startsWith('/admin/clientes')) pageTitle = "Clientes"
  else if (pathname.startsWith('/admin/config')) pageTitle = "Configuración"
  else if (pathname.startsWith('/admin')) pageTitle = "Dashboard"
  else if (pathname.startsWith('/operaciones')) pageTitle = "Operaciones"
  else if (pathname.startsWith('/porteria')) pageTitle = "Portería"
  else if (pathname.startsWith('/activos')) pageTitle = "Gestión de Activos"
  else if (pathname.startsWith('/digitalizador')) pageTitle = "Digitalizador"
  else if (pathname.startsWith('/mobile/cocina')) pageTitle = "Cocina/Usuario"
  else if (pathname.startsWith('/cocina')) pageTitle = "Cocina/Admin"
  else if (pathname.startsWith('/prestamos')) pageTitle = "Préstamo Vehículo/Usuario"

  // ── Shared nav link renderer ───────────────────────────────────────────────
  const NavLink = ({ href, name, icon: Icon, badge }: {
    href: string; name: string; icon: React.ElementType; badge?: number
  }) => {
    const isActive = href === '/admin'
      ? pathname === '/admin'
      : pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
    return (
      <Link
        href={href}
        onClick={() => setIsSidebarOpen(false)}
        className={cn(
          "flex items-center justify-between px-4 py-3 rounded-2xl font-bold transition-all text-sm group",
          isActive
            ? "bg-[#116CA2] text-white shadow-lg shadow-[#116CA2]/20"
            : "text-slate-500 hover:bg-slate-50 hover:text-[#116CA2] dark:hover:bg-zinc-800"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className={cn("size-4 shrink-0 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-[#116CA2]")} />
          <span className="truncate">{name}</span>
          {badge && badge > 0 && (
            <span className="ml-auto size-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shrink-0">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </div>
        {isActive && <ChevronRight className="size-4 shrink-0" />}
      </Link>
    )
  }

  const SidebarContent = () => (
    <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
      {/* Personal dashboard link — always visible */}
      <NavLink href="/dashboard" name="Mi Panel" icon={Home} />

      {isMasterAdmin ? (
        <>
          {/* Admin full navigation */}
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-6 mb-3">Gestión General</p>
          {ADMIN_NAV.map(item => (
            <div key={item.href}>
              <NavLink
                href={item.href}
                name={item.name}
                icon={item.icon}
                badge={item.href === '/admin/vehiculos_menores' ? pendingPrestamos : undefined}
              />
              {/* Operaciones sub-menu */}
              {item.href === '/operaciones' && pathname.startsWith('/operaciones') && (
                <div className="ml-9 pl-4 border-l-2 border-slate-100 dark:border-zinc-800 space-y-1 py-2">
                  {[
                    { name: "Planificación", href: "/operaciones" },
                    { name: "Historial", href: "/operaciones/servicios" },
                    { name: "Flota", href: "/operaciones/flota" },
                    { name: "Pagos", href: "/operaciones/pagos" },
                  ].map(sub => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={cn(
                        "block py-2 text-[11px] font-black uppercase tracking-widest transition-colors",
                        pathname === sub.href ? "text-[#116CA2]" : "text-slate-400 hover:text-[#116CA2]"
                      )}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-6 mb-3">Módulos Principales</p>
          {ALL_MODULES.filter(m => !ADMIN_NAV.some(n => n.href === m.href)).map(item => {
            const DynIcon = IconMap[item.icon] ?? Package
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm group",
                  isActive ? "bg-slate-100 text-[#116CA2] dark:bg-zinc-800" : "text-slate-500 hover:bg-slate-50 hover:text-[#116CA2] dark:hover:bg-zinc-800"
                )}
              >
                <div className={cn("size-6 rounded-lg flex items-center justify-center transition-colors", isActive ? "bg-[#116CA2]/10" : "bg-slate-100 dark:bg-zinc-800")}>
                  <DynIcon className="size-3.5" />
                </div>
                {item.name}
              </Link>
            )
          })}
        </>
      ) : (
        <>
          {/* Regular user — only assigned modules */}
          {userSidebarModules.length > 0 && (
            <>
              <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-6 mb-3">Mis Módulos</p>
              {userSidebarModules.map(item => {
                const DynIcon = IconMap[item.icon] ?? Package
                return (
                  <NavLink key={item.id} href={item.href} name={getModuleDisplayName(item.id, item.view as "user" | "admin")} icon={DynIcon} />
                )
              })}
            </>
          )}
        </>
      )}
    </nav>
  )

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-zinc-950 overflow-hidden font-sans">

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar — mobile drawer */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-white dark:bg-zinc-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out md:hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="bg-[#116CA2] p-1.5 rounded-xl text-white">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-[#116CA2] tracking-[0.2em] leading-none mb-0.5">Tresol ERP</p>
              <h2 className="text-xs font-black text-[#323232] dark:text-white uppercase tracking-tighter">
                {isMasterAdmin ? 'Admin Maestro' : 'Panel Personal'}
              </h2>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setIsSidebarOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>
        <SidebarContent />
      </aside>

      {/* Sidebar — desktop */}
      <aside className="w-72 border-r bg-white dark:bg-zinc-900 hidden md:flex flex-col flex-shrink-0 shadow-xl z-20">
        <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="bg-[#116CA2] p-2 rounded-xl text-white shadow-lg shadow-[#116CA2]/20">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-[#116CA2] tracking-[0.2em] leading-none mb-1">Tresol ERP</p>
              <h2 className="text-sm font-black text-[#323232] dark:text-white uppercase tracking-tighter">
                {isMasterAdmin ? 'Admin Maestro' : 'Panel Personal'}
              </h2>
            </div>
          </div>
        </div>
        <SidebarContent />
        <div className="p-8 border-t border-slate-100 dark:border-zinc-800 mt-auto">
          <p className="text-[11px] font-black text-[#51872E] uppercase tracking-widest">Fabian Aravena</p>
          <p className="text-[8px] font-black text-[#116CA2] uppercase tracking-[0.05em]">Gerente de procesos</p>
          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Ingeniero civil industrial</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 md:h-20 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between px-6 md:px-10 bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
              <h1 className="font-black text-sm md:text-xl text-[#116CA2] dark:text-white uppercase tracking-tight truncate max-w-[120px] sm:max-w-none">
                {pageTitle}
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-6">
            <div className="hidden sm:block">
              <ConnectionStatus />
            </div>
            <div className="hidden md:block h-10 w-[1px] bg-slate-100 dark:bg-zinc-800" />
            <UserProfile variant="header" />
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#FFF9F0]/30 dark:bg-black/20 p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  )
}
