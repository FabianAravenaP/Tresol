"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/uib/card"
import {
  LayoutDashboard,
  MapPin,
  Activity,
  Users,
  Truck,
  Settings,
  ShieldCheck,
  Smartphone,
  FileText,
  Utensils,
  Package,
  Car,
  ChevronRight,
  Lock
} from "lucide-react"
import { ALL_MODULES, parseSidebarConfig, getModuleHref, type SidebarEntry } from "@/lib/modules"
import { cn } from "@/lib/utils"

const IconMap: Record<string, React.ElementType> = {
  LayoutDashboard, MapPin, Activity, Users, Truck, Settings,
  ShieldCheck, Smartphone, FileText, Utensils, Package, Car
}

type ResolvedModule = {
  id: string
  name: string
  description: string
  href: string
  icon: string
  color: string
  view: "user" | "admin"
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [modules, setModules] = useState<ResolvedModule[]>([])

  useEffect(() => {
    const sessionStr = localStorage.getItem('tresol_session')
    if (!sessionStr) { router.push('/'); return }

    const u = JSON.parse(sessionStr)
    setUser(u)

    // master_admin sees all modules when no config is set
    const isMasterAdmin = u.rol === 'master_admin'
    const config: SidebarEntry[] = parseSidebarConfig(u.config_sidebar)

    let resolved: ResolvedModule[]

    if (isMasterAdmin && config.length === 0) {
      resolved = ALL_MODULES.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        href: m.href,
        icon: m.icon,
        color: m.color,
        view: 'admin' as const
      }))
    } else {
      resolved = config
        .map(entry => {
          const mod = ALL_MODULES.find(m => m.id === entry.id)
          if (!mod) return null
          return {
            id: mod.id,
            name: mod.name,
            description: mod.description,
            href: getModuleHref(entry.id, entry.view),
            icon: mod.icon,
            color: mod.color,
            view: entry.view
          }
        })
        .filter((m): m is ResolvedModule => m !== null)
    }

    setModules(resolved)
  }, [router])

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-bold italic text-slate-400">
        Cargando...
      </div>
    )
  }

  const firstName = user.nombre?.split(' ')[0] ?? 'Usuario'

  return (
    <div className="space-y-10">
      {/* Welcome header */}
      <div className="space-y-1">
        <p className="text-[10px] font-black text-[#51872E] uppercase tracking-[0.3em]">Panel Personal</p>
        <h1 className="text-3xl md:text-4xl font-black text-[#323232] dark:text-white tracking-tight">
          Bienvenido, {firstName}
        </h1>
        <p className="text-slate-500 font-medium">
          {modules.length > 0
            ? `Tienes acceso a ${modules.length} módulo${modules.length !== 1 ? 's' : ''}.`
            : 'No tienes módulos asignados aún.'}
        </p>
      </div>

      {/* Module cards */}
      {modules.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((mod) => {
            const Icon = IconMap[mod.icon] ?? Package
            return (
              <Link key={mod.id} href={mod.href}>
                <Card className="group border-none shadow-lg hover:shadow-2xl rounded-[2rem] bg-white dark:bg-zinc-900 transition-all duration-300 overflow-hidden cursor-pointer h-full">
                  <CardContent className="p-8 flex flex-col gap-5 h-full">
                    <div className="flex items-start justify-between">
                      <div
                        className={cn("p-4 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300")}
                        style={{ backgroundColor: `${mod.color.replace('bg-', '')}15` }}
                      >
                        <div
                          className="size-8 flex items-center justify-center"
                          style={{ color: mod.color.startsWith('#') ? mod.color : undefined }}
                        >
                          <Icon className={cn("size-8", !mod.color.startsWith('#') && mod.color.replace('bg-', 'text-'))} />
                        </div>
                      </div>
                      {mod.view === 'admin' && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-[#116CA2]/10 text-[#116CA2] px-2 py-1 rounded-lg">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-black text-[#323232] dark:text-white uppercase tracking-tight">{mod.name}</h3>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{mod.description}</p>
                    </div>
                    <div className="flex justify-end">
                      <div className="size-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-[#116CA2] group-hover:text-white transition-all duration-300">
                        <ChevronRight className="size-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <div className="size-20 rounded-3xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
            <Lock className="size-9 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-[#323232] dark:text-white uppercase tracking-tight">Sin módulos asignados</h3>
            <p className="text-slate-500 font-medium max-w-sm">
              Contacta al administrador del sistema para que te asigne acceso a los módulos que necesitas.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
