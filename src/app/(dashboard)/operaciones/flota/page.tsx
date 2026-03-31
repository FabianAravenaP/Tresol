"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/uib/card"
import { Badge } from "@/components/uib/badge"
import { AlertTriangle, CheckCircle2, Truck, Clock, User, Settings, Info, Navigation2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminFlotaPage() {
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchVehiculos()
    
    // Set up real-time subscription for vehicle status changes
    const channel = supabase
      .channel('public:vehiculos_flota')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehiculos' }, () => {
        fetchVehiculos()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicios_asignados' }, () => {
        fetchVehiculos()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchVehiculos = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch all vehicles
      const { data: vehiculosData, error: vError } = await supabase
        .from('vehiculos')
        .select('*')
        .order('patente')

      if (vError) throw vError

      // Fetch today's services to see who is driving
      const { data: serviciosData, error: sError } = await supabase
        .from('servicios_asignados')
        .select(`
          id,
          vehiculo_id,
          usuarios:chofer_id (nombre),
          estado,
          fecha
        `)
        .eq('fecha', today)

      if (sError) console.warn("Error fetching services for fleet sync:", sError)

      // Join data in JS to avoid inner join ambiguity errors
      const processed = vehiculosData.map((v: any) => {
        const activeService = serviciosData?.find((s: any) => s.vehiculo_id === v.id && s.estado !== 'completado')
        const choferData = activeService?.usuarios as any
        const choferNombre = Array.isArray(choferData) 
          ? (choferData[0]?.nombre || 'Sin chofer asignado')
          : (choferData?.nombre || 'Sin chofer asignado')

        return {
          ...v,
          chofer_nombre: choferNombre,
          en_servicio: activeService ? true : false,
          estado: v.estado || 'OPERATIVO'
        }
      })

      setVehiculos(processed)
    } catch (error) {
      console.error("Error fetching fleet status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Hace instantes'
    if (diffMins < 60) return `Hace ${diffMins} min`
    const diffHours = Math.floor(diffMins / 60)
    return `Hace ${diffHours} h`
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-[#323232]">Monitoreo de Flota</h2>
          <p className="text-muted-foreground font-medium text-lg">Estatus y disponibilidad de activos en tiempo real.</p>
        </div>
        
        <div className="flex gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-muted/50 font-black text-[10px] tracking-widest uppercase">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span>Operativos: {vehiculos.filter(v => !v.estado || v.estado === 'OPERATIVO').length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive">
            <div className="size-2 rounded-full bg-destructive" />
            <span>Fallas: {vehiculos.filter(v => v.estado && v.estado !== 'OPERATIVO').length}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-60 bg-muted animate-pulse rounded-[2rem]" />)}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vehiculos.map((v) => {
            const isFaulty = v.estado && v.estado !== 'OPERATIVO'
            
            return (
              <Card key={v.id} className={cn(
                "transition-all duration-300 shadow-sm border-none ring-1 ring-black/5 rounded-[2rem] overflow-hidden group",
                isFaulty ? "bg-red-50/10" : "bg-white"
              )}>
                <CardHeader className={cn(
                    "flex flex-row items-center justify-between p-6 pb-4",
                    isFaulty ? "bg-destructive text-white" : "bg-[#f8fcf8]"
                )}>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-black flex items-center gap-2 tracking-tight">
                      <Truck className={cn("size-6", isFaulty ? "text-white" : "text-[#51872E]")} />
                      {v.patente}
                    </CardTitle>
                    <CardDescription className={cn(
                        "font-bold uppercase text-[9px] tracking-widest",
                        isFaulty ? "text-red-100" : "text-muted-foreground"
                    )}>
                      {v.tipo}
                    </CardDescription>
                  </div>
                  {isFaulty ? (
                    <div className="bg-white/20 p-2 rounded-full">
                       <AlertTriangle className="size-6 text-white animate-pulse" />
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 p-2 rounded-full">
                       <CheckCircle2 className="size-6 text-[#51872E]" />
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center bg-zinc-50 border rounded-xl p-3 border-muted/50">
                     <div className="flex items-center gap-2">
                        <User className="size-4 text-muted-foreground" />
                        <span className="text-xs font-bold text-[#323232] truncate max-w-[120px]">
                           {v.chofer_nombre || 'Sin Chofer'}
                        </span>
                     </div>
                     <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0",
                        v.en_servicio ? "border-blue-200 text-blue-600 bg-blue-50" : "border-zinc-200 text-zinc-400"
                     )}>
                        {v.en_servicio ? 'En Ruta' : 'Disponible'}
                     </Badge>
                  </div>

                  
                  <div className="space-y-2 px-1">
                    <p className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em]",
                        isFaulty ? "text-destructive" : "text-[#51872E]"
                    )}>
                        Estatus: {v.estado}
                    </p>
                    
                    <div className="bg-muted/30 p-4 rounded-2xl border border-muted/20 min-h-[70px] relative overflow-hidden group-hover:bg-white transition-colors">
                      <p className="text-xs text-[#323232] font-semibold leading-relaxed line-clamp-2 italic relative z-10">
                        "{v.ultima_falla || (v.estado === 'OPERATIVO' ? "Operación estable." : "Sin reporte detallado.")}"
                      </p>
                      <Info className="absolute -bottom-1 -right-1 size-8 opacity-5 text-muted-foreground group-hover:opacity-10" />
                    </div>
                  </div>

                  {v.reporte_falla_at && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest pt-2 px-1">
                      <Clock className="size-3" />
                      {getTimeAgo(v.reporte_falla_at)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      
      <div className="p-8 bg-[#116CA2]/5 rounded-[2rem] flex items-center gap-6 border border-[#116CA2]/10 backdrop-blur-sm">
         <div className="bg-[#116CA2] p-4 rounded-2xl shadow-lg">
            <Settings className="size-10 text-white animate-[spin_8s_linear_infinite]" />
         </div>
         <div className="flex-1">
            <h3 className="text-xl font-black text-[#116CA2] tracking-tight">Sincronización GPS & Mantenimiento</h3>
            <p className="text-sm font-medium text-muted-foreground max-w-2xl">
               Los estados se actualizan automáticamente cada vez que un conductor reporta una novedad desde su consola móvil. 
               El botón de "Reportar Falla" genera una alerta inmediata en este tablero.
            </p>
         </div>
      </div>
    </div>
  )
}