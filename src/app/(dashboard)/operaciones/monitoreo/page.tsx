"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, MapPin, Navigation2, Clock, User, Activity, AlertCircle, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export default function MonitoreoGPSPage() {
  const [serviciosActivos, setServiciosActivos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchServiciosEnRuta()
    
    // Subscribe to registry changes to trigger distance recalculation
    const channel = supabase
      .channel('public:registro_viajes_monitoreo')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registro_viajes', filter: "hito=eq.gps_ping" }, () => {
        fetchServiciosEnRuta()
      })
      .subscribe()

    // Also subscribe to status changes in assigned services
    const channelStatus = supabase
      .channel('public:servicios_monitoreo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicios_asignados' }, () => {
        fetchServiciosEnRuta()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(channelStatus)
    }
  }, [])

  const fetchServiciosEnRuta = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: servicios, error } = await supabase
        .from('servicios_asignados')
        .select(`
          id,
          origen,
          destino,
          estado,
          fecha,
          vehiculos:vehiculo_id (patente, tipo),
          usuarios:chofer_id (nombre)
        `)
        .eq('fecha', today)
        .in('estado', ['en_ruta_origen', 'en_ruta_destino', 'en_origen', 'en_destino'])

      if (error) throw error

      if (servicios) {
        const processed = await Promise.all(servicios.map(async (s: any) => {
          const { data: dist } = await supabase.rpc('get_service_distance', { p_servicio_id: s.id })
          
          // Get last known location
          const { data: lastPos } = await supabase
            .from('registro_viajes')
            .select('latitud, longitud, created_at')
            .eq('servicio_id', s.id)
            .eq('hito', 'gps_ping')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          return {
            ...s,
            kilometraje_acumulado: dist || 0,
            ultima_posicion: lastPos
          }
        }))
        setServiciosActivos(processed)
      }
    } catch (error) {
      console.error("Error fetching monitoring data:", error)
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
    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `${diffMins} min`
    return `${Math.floor(diffMins/60)} h`
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#116CA2] mb-1">
            <Activity className="size-4 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Tracking</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[#323232]">Centro de Monitoreo GPS</h2>
          <p className="text-muted-foreground font-medium text-lg">Seguimiento en tiempo real de servicios y kilometraje.</p>
        </div>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center gap-4">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase">Rutas Activas</span>
              <span className="text-2xl font-black text-[#116CA2]">{serviciosActivos.length}</span>
           </div>
           <div className="h-10 w-[1px] bg-slate-100" />
           <div className="bg-[#116CA2]/10 p-2.5 rounded-xl">
              <Navigation2 className="size-6 text-[#116CA2] rotate-45" />
           </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-muted animate-pulse rounded-[2rem]" />
          <div className="h-64 bg-muted animate-pulse rounded-[2rem]" />
        </div>
      ) : serviciosActivos.length === 0 ? (
        <Card className="border-dashed py-20 bg-white/50 rounded-[2.5rem]">
           <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-slate-100 p-6 rounded-full">
                 <MapPin className="size-12 text-slate-300" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-xl font-bold text-slate-900">No hay rutas activas</h3>
                 <p className="text-slate-500 max-w-xs">Actualmente no hay choferes transmitiendo ubicación GPS en tiempo real.</p>
              </div>
           </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {serviciosActivos.map((s) => (
            <Card key={s.id} className="rounded-[2rem] border-none shadow-xl overflow-hidden group hover:ring-2 hover:ring-[#116CA2]/20 transition-all duration-300">
               <CardHeader className="bg-[#116CA2] text-white p-6 pb-4">
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <Truck className="size-5" />
                           <span className="text-lg font-black tracking-tight">{(s.vehiculos as any)?.patente}</span>
                        </div>
                        <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest leading-none">
                           {(s.vehiculos as any)?.tipo} • {s.estado.replace(/_/g, ' ')}
                        </p>
                     </div>
                     <Badge className="bg-white/20 hover:bg-white/30 text-white border-none rounded-full px-3">
                        {getTimeAgo(s.ultima_posicion?.created_at)}
                     </Badge>
                  </div>
               </CardHeader>

               <CardContent className="p-6 space-y-6">
                  {/* Driver Info */}
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                     <div className="bg-[#116CA2]/10 p-2 rounded-xl">
                        <User className="size-4 text-[#116CA2]" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Conductor en Ruta</p>
                        <p className="font-bold text-slate-900 truncate">{(s.usuarios as any)?.nombre}</p>
                     </div>
                  </div>

                  {/* Distance Indicator */}
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                     <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Kilometraje Acumulado</p>
                        <p className="text-3xl font-black text-emerald-700 leading-none">
                           {s.kilometraje_acumulado.toFixed(1)} <small className="text-xs">KM</small>
                        </p>
                     </div>
                     <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                        <Navigation2 className="size-6 text-white rotate-45" />
                     </div>
                  </div>

                  {/* Route Details */}
                  <div className="space-y-4 pt-2">
                     <div className="flex gap-4 items-start">
                        <div className="flex flex-col items-center gap-1 pt-1">
                           <div className="size-2 rounded-full bg-blue-500" />
                           <div className="w-[1px] h-6 bg-slate-200" />
                           <div className="size-2 rounded-full bg-emerald-500" />
                        </div>
                        <div className="space-y-3 flex-1">
                           <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase">Origen</p>
                              <p className="text-xs font-bold text-slate-800 line-clamp-1">{s.origen}</p>
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase">Destino</p>
                              <p className="text-xs font-bold text-slate-800 line-clamp-1">{s.destino}</p>
                           </div>
                        </div>
                     </div>
                  </div>
                  
                  {s.ultima_posicion && (
                    <div className="pt-4 border-t flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <span className="flex items-center gap-1.5">
                          <MapPin className="size-3 text-[#116CA2]" />
                          Último Ping: {s.ultima_posicion.latitud.toFixed(4)}, {s.ultima_posicion.longitud.toFixed(4)}
                       </span>
                       <Clock className="size-3" />
                    </div>
                  )}
               </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Security/Access Note */}
      <div className="p-8 bg-zinc-900 rounded-[2.5rem] flex items-center gap-6 text-white shadow-2xl">
         <div className="bg-[#116CA2] p-4 rounded-2xl">
            <ShieldCheck className="size-10 text-white" />
         </div>
         <div className="space-y-1">
            <h3 className="text-xl font-black tracking-tight">Protocolo de Privacidad Tresol</h3>
            <p className="text-xs text-zinc-400 max-w-2xl font-medium leading-relaxed">
               Este módulo utiliza cifrado de extremo a extremo para el seguimiento GPS. Los datos de ubicación se almacenan únicamente durante la ejecución del servicio y se anonimizan automáticamente al finalizar la ruta, cumpliendo con los estándares de seguridad para el personal operativo.
            </p>
         </div>
      </div>
    </div>
  )
}
