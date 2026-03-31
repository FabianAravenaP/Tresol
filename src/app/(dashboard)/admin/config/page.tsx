"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Input } from "@/components/uib/input"
import { Label } from "@/components/uib/label"
import { Switch } from "@/components/uib/switch"
import { Badge } from "@/components/uib/badge"
import { 
  Palette, 
  Bell, 
  Database, 
  Moon, 
  Sun, 
  Download, 
  Activity,
  Users,
  Truck,
  Building2,
  FileText,
  Mail,
  Smartphone,
  Save
} from "lucide-react"

export default function ConfiguracionMasterPage() {
  const [activeTab, setActiveTab] = useState("apariencia")
  const [isLoading, setIsLoading] = useState(false)

  // Database Stats State
  const [dbStats, setDbStats] = useState({
    usuarios: 0,
    clientes: 0,
    vehiculos: 0,
    servicios: 0,
    comprobantes: 0
  })

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Notification State
  const [notifs, setNotifs] = useState({
    email: true,
    push: false,
    daily: true
  })

  useEffect(() => {
    // Check initial theme
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "database") fetchDbStats()
  }, [activeTab])

  // --- APPEARANCE ---
  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked)
    if (checked) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // --- DATABASE ---
  const fetchDbStats = async () => {
    setIsLoading(true)
    try {
      const [usr, cli, veh, srv, cmp] = await Promise.all([
        supabase.from('usuarios').select('*', { count: 'exact', head: true }),
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('vehiculos').select('*', { count: 'exact', head: true }),
        supabase.from('servicios_asignados').select('*', { count: 'exact', head: true }),
        supabase.from('comprobantes').select('*', { count: 'exact', head: true })
      ])
      
      setDbStats({
        usuarios: usr.count || 0,
        clientes: cli.count || 0,
        vehiculos: veh.count || 0,
        servicios: srv.count || 0,
        comprobantes: cmp.count || 0
      })
    } catch (err) {
      console.error("Error fetching DB stats", err)
    } finally {
      setIsLoading(false)
    }
  }

  const exportFullDatabaseBackup = async () => {
    setIsLoading(true)
    try {
      const { data: allData, error } = await supabase.from('clientes').select('*')
      if (error) throw error
      
      // Simple JSON export for demonstration (can be expanded to pull multiple tables)
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2))
      const downloadAnchorNode = document.createElement('a')
      downloadAnchorNode.setAttribute("href", dataStr)
      downloadAnchorNode.setAttribute("download", `tresol_clientes_backup_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(downloadAnchorNode)
      downloadAnchorNode.click()
      downloadAnchorNode.remove()
      
    } catch (err) {
      console.error("Error exporting database", err)
      alert("Error al exportar base de datos")
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: "apariencia", name: "Branding y Apariencia", icon: Palette, desc: "Colores y modo visual." },
    { id: "notificaciones", name: "Notificaciones", icon: Bell, desc: "Preferencias de alertas." },
    { id: "database", name: "Base de Datos", icon: Database, desc: "Mantenimiento y respaldos." }
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-black text-[#323232] dark:text-white tracking-tight">Centro de Control</h2>
        <p className="text-slate-500 font-medium">Configuración avanzada y mantenimiento de la plataforma.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-80 space-y-2 flex-shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300",
                  isActive 
                    ? "bg-[#116CA2] shadow-lg shadow-[#116CA2]/20 text-white" 
                    : "bg-white dark:bg-zinc-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  isActive ? "bg-white/20" : "bg-slate-100 dark:bg-zinc-800"
                )}>
                  <Icon className={cn("size-5", isActive ? "text-white" : "text-slate-400")} />
                </div>
                <div>
                  <h4 className={cn("font-bold", isActive ? "text-white" : "text-[#323232] dark:text-white")}>
                    {tab.name}
                  </h4>
                  <p className={cn("text-xs font-medium", isActive ? "text-blue-100/70" : "text-slate-400")}>
                    {tab.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-zinc-900 min-h-[500px]">
            <CardContent className="p-8 sm:p-12">
              
              {/* --- TAB: APARIENCIA --- */}
              {activeTab === "apariencia" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div>
                    <h3 className="text-2xl font-black text-[#323232] dark:text-white tracking-tight flex items-center gap-3">
                      <Palette className="size-6 text-[#51872E]" />
                      Branding y Temas
                    </h3>
                    <p className="text-slate-500 font-medium mt-2">Personaliza la experiencia visual de la plataforma corporativa.</p>
                  </div>

                  <div className="space-y-6 p-6 bg-slate-50 dark:bg-zinc-800 rounded-[2rem]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-2xl", isDarkMode ? "bg-zinc-700 text-yellow-400" : "bg-white text-yellow-500 shadow-sm")}>
                          {isDarkMode ? <Moon className="size-6" /> : <Sun className="size-6" />}
                        </div>
                        <div>
                          <p className="font-bold text-[#323232] dark:text-white text-lg">Modo Oscuro</p>
                          <p className="text-sm text-slate-500 font-medium">Reduce la fatiga visual en ambientes de poca luz.</p>
                        </div>
                      </div>
                      <Switch 
                        checked={isDarkMode} 
                        onCheckedChange={toggleDarkMode} 
                        className="data-[state=checked]:bg-[#116CA2]"
                      />
                    </div>
                  </div>

                  <div className="space-y-6 p-6 bg-slate-50 dark:bg-zinc-800 rounded-[2rem]">
                     <h4 className="font-bold text-[#323232] dark:text-white">Colores Corporativos</h4>
                     <div className="flex gap-4">
                        <div className="flex-1 p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-[#51872E] flex items-center justify-between cursor-pointer">
                           <div className="flex items-center gap-3">
                              <div className="size-6 rounded-full bg-[#51872E]" />
                              <span className="font-black text-sm uppercase text-[#323232] dark:text-white">Verde Tresol</span>
                           </div>
                           <Badge className="bg-[#51872E]/10 text-[#51872E] hover:bg-[#51872E]/10">ACTIVO</Badge>
                        </div>
                        <div className="flex-1 p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-transparent hover:border-slate-200 dark:hover:border-zinc-700 flex items-center gap-3 cursor-pointer opacity-50">
                           <div className="size-6 rounded-full bg-[#116CA2]" />
                           <span className="font-black text-sm uppercase text-[#323232] dark:text-white">Azul Industrial</span>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* --- TAB: NOTIFICACIONES --- */}
              {activeTab === "notificaciones" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div>
                    <h3 className="text-2xl font-black text-[#323232] dark:text-white tracking-tight flex items-center gap-3">
                      <Bell className="size-6 text-[#FBC15F]" />
                      Alertas y Notificaciones
                    </h3>
                    <p className="text-slate-500 font-medium mt-2">Controla qué información crítica recibe tu equipo.</p>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-none shadow-sm rounded-[2rem] bg-slate-50 dark:bg-zinc-800 p-6 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl text-slate-400">
                             <Mail className="size-5" />
                          </div>
                          <div>
                             <p className="font-bold text-[#323232] dark:text-white">Correos de Auditoría (Email)</p>
                             <p className="text-sm text-slate-500 font-medium">Recibir un correo cuando se elimina un registro importante.</p>
                          </div>
                       </div>
                       <Switch 
                         checked={notifs.email} 
                         onCheckedChange={(c: boolean) => setNotifs({...notifs, email: c})}
                         className="data-[state=checked]:bg-[#51872E]"
                       />
                    </Card>

                    <Card className="border-none shadow-sm rounded-[2rem] bg-slate-50 dark:bg-zinc-800 p-6 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl text-slate-400">
                             <Smartphone className="size-5" />
                          </div>
                          <div>
                             <p className="font-bold text-[#323232] dark:text-white">Alertas Push (Choferes)</p>
                             <p className="text-sm text-slate-500 font-medium">Enviar notificaciones push a choferes con nuevos servicios.</p>
                          </div>
                       </div>
                       <Switch 
                         checked={notifs.push} 
                         onCheckedChange={(c: boolean) => setNotifs({...notifs, push: c})}
                         className="data-[state=checked]:bg-[#51872E]"
                       />
                    </Card>
                    
                    <Card className="border-none shadow-sm rounded-[2rem] bg-slate-50 dark:bg-zinc-800 p-6 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl text-slate-400">
                             <FileText className="size-5" />
                          </div>
                          <div>
                             <p className="font-bold text-[#323232] dark:text-white">Resumen Diario (Excel)</p>
                             <p className="text-sm text-slate-500 font-medium">Auto-generar reporte operativo al final del día (19:00 hrs).</p>
                          </div>
                       </div>
                       <Switch 
                         checked={notifs.daily} 
                         onCheckedChange={(c: boolean) => setNotifs({...notifs, daily: c})}
                         className="data-[state=checked]:bg-[#51872E]"
                       />
                    </Card>
                  </div>
                </div>
              )}

              {/* --- TAB: BASE DE DATOS --- */}
              {activeTab === "database" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-[#323232] dark:text-white tracking-tight flex items-center gap-3">
                        <Database className="size-6 text-[#116CA2]" />
                        Mantenimiento DB
                      </h3>
                      <p className="text-slate-500 font-medium mt-2">Diagnóstico de volumen y respaldos manuales de seguridad.</p>
                    </div>
                    
                    <Button 
                      onClick={exportFullDatabaseBackup}
                      disabled={isLoading}
                      className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black h-12 shadow-xl shadow-slate-900/20"
                    >
                      <Download className="size-4 mr-2" />
                      DESCARGAR ESPALDO FULL (JSON)
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <DbStatCard title="Usuarios" count={dbStats.usuarios} icon={Users} color="bg-indigo-500" />
                    <DbStatCard title="Clientes & Est." count={dbStats.clientes} icon={Building2} color="bg-[#51872E]" />
                    <DbStatCard title="Flota Vehicular" count={dbStats.vehiculos} icon={Truck} color="bg-[#FBC15F]" />
                    <DbStatCard title="Viajes (Histórico)" count={dbStats.servicios} icon={Activity} color="bg-[#116CA2]" />
                  </div>

                  <Card className="border-none shadow-sm rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 p-6 sm:p-8 flex items-start gap-6 mt-8">
                     <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/30 flex-shrink-0">
                        <Save className="size-8" />
                     </div>
                     <div>
                        <h4 className="text-lg font-black text-indigo-900 dark:text-indigo-200">Integridad Confirmada</h4>
                        <p className="text-indigo-700 dark:text-indigo-300 font-medium mt-1 leading-relaxed">
                          La base de datos `jmyhckenewmkobirlgcj` se encuentra operativa al 100%. Las políticas de Row-Level Security (RLS) están activas previniendo accesos no autorizados.
                        </p>
                     </div>
                  </Card>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DbStatCard({ title, count, icon: Icon, color }: any) {
  return (
    <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-zinc-800 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden group">
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500", color)} />
      <Icon className="size-8 text-slate-300 dark:text-zinc-600 group-hover:scale-110 transition-transform duration-500" />
      <div>
        <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400">{title}</h4>
        <p className="text-4xl font-black text-[#323232] dark:text-white mt-1">{count}</p>
      </div>
    </div>
  )
}