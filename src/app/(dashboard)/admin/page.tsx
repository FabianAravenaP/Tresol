"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { useRouter } from "next/navigation"
import { useOfflineSync } from "@/hooks/useOfflineSync"
import { ALL_MODULES } from "@/lib/modules"
import { 
  Users, 
  Truck, 
  ClipboardCheck, 
  LayoutDashboard, 
  ArrowUpRight,
  UserCheck,
  Activity,
  AlertCircle,
  ShieldCheck, 
  Smartphone, 
  FileText,
  RefreshCw,
  ChefHat,
  Package,
  Utensils,
  MapPin,
  Settings,
  Home,
  Car
} from "lucide-react"

const IconMap: any = { 
  LayoutDashboard, MapPin, Activity, Users, Truck, Settings, 
  Home, Smartphone, FileText, Utensils, ChefHat, ShieldCheck, Package, Car 
}

export default function MasterDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeDrivers: 0,
    totalVehicles: 0,
    maintenanceVehicles: 0,
    pendingServices: 0,
    totalPersonal: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch User stats
      const { count: usersCount } = await supabase.from('usuarios').select('*', { count: 'exact', head: true })
      const { count: driversCount } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'chofer')
      
      // Fetch Vehicle stats
      const { count: vehicleCount } = await supabase.from('vehiculos').select('*', { count: 'exact', head: true })
      const { count: maintenanceCount } = await supabase.from('vehiculos').select('*', { count: 'exact', head: true }).eq('estado', 'FALLA MECÁNICA')
      
      // Fetch Personal stats
      const { count: personalCount } = await supabase.from('maestro_personas').select('*', { count: 'exact', head: true })

      // Fetch Service stats
      const today = new Date().toISOString().split('T')[0]
      const { count: pendingCount } = await supabase.from('servicios_asignados').select('*', { count: 'exact', head: true }).eq('fecha', today).eq('estado', 'pendiente')

      setStats({
        totalUsers: usersCount || 0,
        activeDrivers: driversCount || 0,
        totalVehicles: vehicleCount || 0,
        maintenanceVehicles: maintenanceCount || 0,
        pendingServices: pendingCount || 0,
        totalPersonal: personalCount || 0
      })
    } catch (error) {
      console.error("Error fetching admin stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const { isOnline, pendingCount } = useOfflineSync()

  // Calculate System Health Dynamically (Technical Layer Only)
  const getSystemStatus = () => {
    if (!isOnline) return { 
      value: "Crítico", 
      subtitle: "Sin conexión a internet", 
      color: "amber",
      icon: AlertCircle 
    }
    if (pendingCount > 0) return { 
      value: "Sincronizando", 
      subtitle: `${pendingCount} acciones en cola local`, 
      color: "indigo",
      icon: RefreshCw 
    }
    return { 
      value: "Óptimo", 
      subtitle: "Motor de Resiliencia Activo", 
      color: "blue",
      icon: ShieldCheck 
    }
  }

  const systemHealth = getSystemStatus()

  return (
    <div className="space-y-6 md:space-y-10 p-6 md:p-8 max-w-[1600px] mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#323232] dark:text-white tracking-tight">Resumen del Sistema</h2>
          <p className="text-slate-500 font-medium text-sm md:text-base">Control unificado de todas las operaciones de Tresol.</p>
        </div>
        <div className="flex gap-2 md:gap-3">
           <Button onClick={() => router.push('/admin/usuarios')} className="bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-2xl font-black shadow-lg shadow-[#116CA2]/20 text-xs md:text-sm h-9 md:h-10">
              <Users className="size-4 mr-1.5" />
              <span className="hidden sm:inline">Garantizar </span>Usuarios
           </Button>
           <Button variant="outline" onClick={() => fetchStats()} className="rounded-2xl border-slate-200 font-bold hover:bg-white shadow-sm text-xs md:text-sm h-9 md:h-10">
              <Activity className="size-4 mr-1.5" />
              Actualizar
           </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard 
          title="Usuarios Totales" 
          value={stats.totalUsers} 
          subtitle={`${stats.activeDrivers} Conductores Activos`}
          icon={Users}
          color="blue"
        />
        <StatCard 
          title="Flota Total" 
          value={stats.totalVehicles} 
          subtitle={`${stats.maintenanceVehicles} en Mantenimiento`}
          icon={Truck}
          color="emerald"
        />
        <StatCard 
          title="Servicios Hoy" 
          value={stats.pendingServices} 
          subtitle="Pendientes de inicio"
          icon={ClipboardCheck}
          color="amber"
        />
        <StatCard 
          title="Personal Portería" 
          value={stats.totalPersonal} 
          subtitle="Trabajadores en Maestro"
          icon={Users}
          color="indigo"
        />
        <StatCard 
          title="Estado Sistema" 
          value={systemHealth.value} 
          subtitle={systemHealth.subtitle}
          icon={systemHealth.icon}
          color={systemHealth.color}
        />
      </div>

      {/* Modules Health */}
      {/* Modules Health / Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
        {ALL_MODULES.filter(m => 
          ["cocina", "operativo", "mobile", "digitalizador", "porteria", "activos", "prestamos"].includes(m.id)
        ).sort((a,b) => {
          const order = ["cocina", "operativo", "mobile", "digitalizador", "porteria", "activos", "prestamos"];
          return order.indexOf(a.id) - order.indexOf(b.id);
        }).map((mod) => (
          <ModuleCard 
            key={mod.id}
            title={mod.name} 
            status="Activo" 
            desc={mod.description}
            path={mod.href}
            icon={IconMap[mod.icon] || LayoutDashboard}
          />
        ))}
      </div>

      {/* Recent Alerts (Placeholder Logic) */}
      <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 dark:border-zinc-800 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
             <AlertCircle className="text-amber-500 size-6" />
             Alertas del Sistema
          </CardTitle>
          <Button variant="ghost" className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-[#116CA2]">
            Ver Historial
          </Button>
        </CardHeader>
        <CardContent className="p-8">
           {stats.maintenanceVehicles > 0 ? (
             <div className="flex items-center gap-4 p-5 rounded-3xl bg-amber-50 border border-amber-100 text-amber-800 animate-pulse">
                <Truck className="size-6" />
                <div className="flex-1">
                  <p className="font-black text-sm uppercase leading-none mb-1">Fallas Reportadas</p>
                  <p className="text-xs font-bold opacity-80">Hay {stats.maintenanceVehicles} vehículos que requieren atención técnica inmediata.</p>
                </div>
                <Button size="sm" onClick={() => router.push('/operaciones/flota')} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold">
                   Gestionar
                </Button>
             </div>
           ) : (
             <div className="text-center py-10 space-y-3 opacity-40">
                <ShieldCheck className="size-12 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin alertas críticas reportadas</p>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  }

  return (
    <Card className="border-none shadow-xl rounded-[2rem] bg-white dark:bg-zinc-900 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
      <CardContent className="p-8 space-y-4">
        <div className={cn("p-4 rounded-2xl w-fit transition-transform group-hover:rotate-6", colors[color])}>
          <Icon className="size-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-[#323232] dark:text-white tracking-tighter">{value}</h3>
          </div>
          <p className="text-xs font-bold text-slate-500 mt-2">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ModuleCard({ title, status, desc, path, icon: Icon }: any) {
  const router = useRouter()
  return (
    <Card 
        className="border-none shadow-lg rounded-[2.5rem] bg-white dark:bg-zinc-900 p-8 space-y-6 group cursor-pointer hover:shadow-2xl transition-all border-b-4 border-transparent hover:border-[#116CA2]"
        onClick={() => router.push(path)}
    >
      <div className="flex justify-between items-start">
        <div className="p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl text-slate-400 group-hover:text-[#116CA2] group-hover:bg-[#116CA2]/5 transition-all">
          <Icon className="size-8" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
           <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="text-2xl font-black text-[#323232] dark:text-white tracking-tight">{title}</h4>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
      <div className="pt-4 flex items-center gap-2 text-[#116CA2] font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
        Entrar al módulo
        <ArrowUpRight className="size-4" />
      </div>
    </Card>
  )
}
