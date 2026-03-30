"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Truck, Navigation2, AlertTriangle, CalendarDays } from "lucide-react"
import { NavigationHeader } from "@/components/NavigationHeader"
import { CalendarMinimalist } from "@/components/CalendarMinimalist"
import { UserProfile } from "@/components/UserProfile"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useOfflineSync } from "@/hooks/useOfflineSync"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { SkeletonService } from "@/components/SkeletonService"

export default function MobilePage() {
  const router = useRouter()
  const { isOnline, addToOfflineQueue } = useOfflineSync()
  const [servicio, setServicio] = useState<any>(null)
  const [bonoAproximado, setBonoAproximado] = useState<number | null>(null)
  const [tipoVehiculo, setTipoVehiculo] = useState<string | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isFallaModalOpen, setIsFallaModalOpen] = useState(false)
  const [observacionFalla, setObservacionFalla] = useState("")
  const [isSubmittingFalla, setIsSubmittingFalla] = useState(false)
  const [currentChofer, setCurrentChofer] = useState<any>(null)
  const [allServicios, setAllServicios] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  useEffect(() => {
    // Read the centralized session created in /page.tsx
    const sessionStr = localStorage.getItem('tresol_session')
    if (sessionStr) {
      try {
        const user = JSON.parse(sessionStr)
        // Ensure access for drivers, admins, and master_admins
        if (user.rol === 'chofer' || user.rol === 'admin' || user.rol === 'master_admin') {
           setCurrentChofer(user)
           if (user.rol === 'chofer') {
             fetchServicios(user.id)
             
             // Real-time subscription for driver's services
             const channel = supabase
               .channel(`driver_sync_${user.id}`)
               .on('postgres_changes', { 
                  event: '*', 
                  schema: 'public', 
                  table: 'servicios_asignados', 
                  filter: `chofer_id=eq.${user.id}` 
               }, () => {
                 fetchServicios(user.id)
               })
               .subscribe()

             return () => {
               supabase.removeChannel(channel)
             }
           } else {
             setIsLoading(false)
           }
        } else {
           // Not authorized for this module, redirect back home
           window.location.href = '/'
        }
      } catch (e) {
        console.error("Invalid session data")
        window.location.href = '/'
      }
    } else {
       // No session at all, redirect to main login
       window.location.href = '/'
    }
  }, [])

  // GPS Tracking Logic
  useEffect(() => {
    let watchId: number | null = null;
    let lastPingTime = 0;
    const PING_INTERVAL = 60000; // 60 seconds

    const isTrackingState = (estado: string) => 
      ['en_ruta_origen', 'en_ruta_destino'].includes(estado);

    if (servicio && isTrackingState(servicio.estado) && navigator.geolocation && !isSimulating) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const now = Date.now();
          if (now - lastPingTime > PING_INTERVAL) {
            lastPingTime = now;
            const { latitude, longitude } = position.coords;
            
            try {
              setGeoError(null) // Clear any previous error on success
              await fetch('/api/proxy', {
                method: 'POST',
                body: JSON.stringify({
                  table: 'registro_viajes',
                  method: 'insert',
                  data: {
                    servicio_id: servicio.id,
                    hito: 'gps_ping',
                    latitud: latitude,
                    longitud: longitude
                  }
                })
              });
            } catch (err) {
              console.error("GPS Ping error:", err);
            }
          }
        },
        (error) => {
          let msg = ""
          switch(error.code) {
            case error.PERMISSION_DENIED: msg = "Permiso de GPS denegado."; break;
            case error.POSITION_UNAVAILABLE: msg = "Señal de GPS no disponible."; break;
            case error.TIMEOUT: msg = "Tiempo de espera de GPS agotado."; break;
            default: msg = "Error de GPS desconocido."; break;
          }
          console.error(`Geolocation error [${error.code}]: ${error.message}`);
          setGeoError(msg)
        },
        { 
          enableHighAccuracy: true, 
          timeout: 20000, // Increased timeout to 20s
          maximumAge: 0 
        }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [servicio?.id, servicio?.estado, isSimulating]);

  // Simulation Logic
  useEffect(() => {
    if (!isSimulating || !servicio) return;

    const PING_INTERVAL = 60000;
    console.log("GPS Simulation started.");

    const interval = setInterval(async () => {
      // Mock coordinates (Santiago center area with slight variance)
      const latitude = -33.4489 + (Math.random() - 0.5) * 0.01;
      const longitude = -70.6693 + (Math.random() - 0.5) * 0.01;

      try {
        console.log("Simulated GPS Ping:", { latitude, longitude });
        await fetch('/api/proxy', {
          method: 'POST',
          body: JSON.stringify({
            table: 'registro_viajes',
            method: 'insert',
            data: {
              servicio_id: servicio.id,
              hito: 'gps_ping',
              latitud: latitude,
              longitud: longitude
            }
          })
        });
      } catch (err) {
        console.error("Simulated GPS Ping error:", err);
      }
    }, PING_INTERVAL);

    return () => clearInterval(interval);
  }, [isSimulating, servicio?.id]);

  const handleAcceptTrip = async () => {
    if (!servicio) return
    setIsLoading(true)

    const updateServicio = { estado: 'en_ruta_origen' }
    const updateVehiculo = { 
      estado: 'OPERATIVO',
      reporte_falla_at: null,
      ultima_falla: null
    }

    try {
      if (!isOnline) {
        addToOfflineQueue('servicios_asignados', updateServicio, 'update', { id: servicio.id })
        if (servicio.vehiculo_id) {
          addToOfflineQueue('vehiculos', updateVehiculo, 'update', { id: servicio.vehiculo_id })
        }
        toast.warning("Modo Offline: El cambio se ha guardado localmente y se sincronizará al recuperar conexión.")
      } else {
        await fetch('/api/proxy', {
           method: 'POST',
           body: JSON.stringify({
              table: 'servicios_asignados',
              method: 'update',
              data: updateServicio,
              match: { id: servicio.id }
           })
        })

        if (servicio.vehiculo_id) {
           await fetch('/api/proxy', {
              method: 'POST',
              body: JSON.stringify({
                 table: 'vehiculos',
                 method: 'update',
                 data: updateVehiculo,
                 match: { id: servicio.vehiculo_id }
              })
           })
        }
      }
      
      setServicio({ ...servicio, estado: 'en_ruta_origen' })
    } catch (err: any) {
      console.error("Error updating trip status:", err)
      addToOfflineQueue('servicios_asignados', updateServicio, 'update', { id: servicio.id })
      if (servicio.vehiculo_id) {
        addToOfflineQueue('vehiculos', updateVehiculo, 'update', { id: servicio.vehiculo_id })
      }
      toast.error(`Error: ${err.message || "Error de conexión"}. Se guardó localmente.`)
      setServicio({ ...servicio, estado: 'en_ruta_origen' })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchServicios = async (choferId: string) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/proxy', {
         method: 'POST',
         body: JSON.stringify({
            table: 'servicios_asignados',
            method: 'select',
            data: `
              id,
              fecha,
              origen,
              destino,
              carga,
              estado,
              bono_tipo_vehiculo,
              vehiculo_id,
              vehiculos:vehiculo_id (tipo)
            `,
            match: { chofer_id: choferId }
         })
      })
      const { data } = await res.json()
      setAllServicios(data || [])
    } catch (error) {
      console.error("Error fetching services:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Effect to update current service when allServicios or selectedDate changes
  useEffect(() => {
    if (allServicios.length === 0) {
      setServicio(null)
      setBonoAproximado(null)
      setTipoVehiculo(null)
      return
    }

    const dateStr = selectedDate.toISOString().split('T')[0]
    const filtered = allServicios.filter((s: any) => s.fecha === dateStr)
    
    // Sort to prioritize active over completed for that day if multiple
    const data = filtered.find((s: any) => s.estado !== 'completado') || filtered[0]

    if (data) {
      setServicio(data)
      setTipoVehiculo(data.vehiculos?.tipo || null)
      
      // Calculate approximate bonus
      if (data.bono_tipo_vehiculo) {
        setBonoAproximado(data.bono_tipo_vehiculo)
      } else {
        setBonoAproximado(null)
      }
    } else {
      setServicio(null)
      setBonoAproximado(null)
      setTipoVehiculo(null)
    }
  }, [allServicios, selectedDate])

  const handleReportarFalla = async () => {
    if (!observacionFalla.trim()) {
      toast.error("Por favor describa la falla.")
      return
    }

    if (!servicio?.vehiculo_id) return

    const updateData = {
      estado: 'FALLA MECÁNICA',
      ultima_falla: observacionFalla,
      reporte_falla_at: new Date().toISOString()
    }

    setIsSubmittingFalla(true)
    try {
      if (!isOnline) {
        addToOfflineQueue('vehiculos', updateData, 'update', { id: servicio.vehiculo_id })
        alert("Sin conexión. Reporte guardado localmente.")
      } else {
        await fetch('/api/proxy', {
           method: 'POST',
           body: JSON.stringify({
              table: 'vehiculos',
              method: 'update',
              data: updateData,
              match: { id: servicio.vehiculo_id }
           })
        })
        toast.success("Falla técnica reportada exitosamente.")
      }
      
      setIsFallaModalOpen(false)
      setObservacionFalla("")
    } catch (err: any) {
      console.error("Error reporting falla:", err)
      if (servicio.vehiculo_id) {
        addToOfflineQueue('vehiculos', updateData, 'update', { id: servicio.vehiculo_id })
      }
      toast.error(`Error: ${err.message || "Error de conexión"}. Reporte guardado localmente.`)
      setIsFallaModalOpen(false)
      setObservacionFalla("")
    } finally {
      setIsSubmittingFalla(false)
    }
  }

  // Format date correctly based on selectedDate
  const displayDate = selectedDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })

  // Not Logged In Screen (Handled by strict redirect above, but returning null to avoid flash)
  if (!currentChofer) {
    return <div className="flex h-screen items-center justify-center"><Truck className="size-8 text-primary animate-bounce opacity-30" /></div>
  }

  // Logged In Screen
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950">
      <NavigationHeader 
        title="App Conductor" 
        subtitle="Gestión de Ruta" 
        hideProfile={true} 
      />

      <main className="p-4 pb-24 space-y-5 animate-in slide-in-from-bottom-4 duration-500">
        {geoError && !isSimulating && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl flex flex-col gap-3 text-amber-800 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold">Problema de GPS</p>
                <p className="text-[10px] opacity-80">{geoError} Verifica tus permisos.</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full h-10 border-amber-200 bg-white hover:bg-amber-100 text-amber-700 text-[10px] font-bold uppercase"
              onClick={() => {
                setGeoError(null)
                setIsSimulating(true)
              }}
            >
              Simular Ubicación (Modo Pruebas)
            </Button>
          </div>
        )}

        {isSimulating && (
           <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-3 text-emerald-800 animate-pulse">
             <Navigation2 className="size-4 animate-spin-slow" />
             <p className="text-[10px] font-bold uppercase tracking-widest">Simulación de GPS Activa</p>
           </div>
        )}
        <UserProfile variant="dashboard" className="px-1 mb-2" />

        <div className="flex justify-between items-end px-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#116CA2]">
              <CalendarDays className="size-4" />
              <span className="text-xs font-bold uppercase tracking-widest">{displayDate}</span>
            </div>
            <h1 className="text-2xl font-black text-[#323232] dark:text-white uppercase tracking-tight">Mi Operación</h1>
          </div>
        </div>

        <CalendarMinimalist 
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          serviceDays={Array.from(new Set(allServicios.map(s => s.fecha)))}
        />
      

      
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
               <SkeletonService />
            </motion.div>
          ) : !servicio ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="shadow-sm border-dashed bg-white/40 dark:bg-zinc-900/40 rounded-[2.5rem] backdrop-blur-sm">
                <CardContent className="py-20 text-center space-y-6">
                  <div className="bg-muted/50 size-20 rounded-full flex items-center justify-center mx-auto transition-transform hover:scale-110 duration-500">
                    <FileText className="size-10 text-muted-foreground/60" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-black text-foreground uppercase tracking-tight">Sin servicios hoy</p>
                    <p className="text-sm text-muted-foreground px-10 font-medium leading-relaxed">No tienes rutas programadas para esta fecha. ¡Buen descanso!</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div 
              key="active-service"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="space-y-6"
            >
              {/* PRIMARY ACTION HERO CARD */}
              <Card className="shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-900 ring-1 ring-black/5">
                <div className={cn(
                  "h-3 w-full animate-pulse",
                  servicio.estado === 'pendiente' ? "bg-accent" :
                  servicio.estado === 'en_ruta_origen' ? "bg-secondary" :
                  "bg-primary"
                )} />
                
                <CardHeader className="pb-6 pt-10 px-8">
                  <div className="flex justify-between items-start gap-6">
                    <div className="space-y-3">
                      <Badge 
                        className={cn(
                            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-none shadow-sm",
                            servicio.estado === 'pendiente' ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" :
                            servicio.estado === 'en_ruta_origen' ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" :
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                        )}
                      >
                        {servicio.estado === 'en_ruta_origen' ? 'En ruta a carga' : 
                         servicio.estado === 'completado' ? 'Servicio Finalizado' : 
                         'Pendiente de Inicio'}
                      </Badge>
                      <CardTitle className="text-3xl font-black text-[#1e1e1e] dark:text-white leading-tight italic uppercase tracking-tighter">
                        {servicio.estado === 'completado' ? 'Resumen del Viaje' : 'Tarea Actual'}
                      </CardTitle>
                    </div>
                    {bonoAproximado && (
                       <div className="text-right bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/20 shadow-sm">
                         <p className="text-[9px] uppercase font-black text-emerald-600 dark:text-emerald-400 mb-1 tracking-widest">Bono Est.</p>
                         <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                            ${new Intl.NumberFormat('es-CL').format(bonoAproximado)}
                         </p>
                       </div>
                    )}
                  </div>
                </CardHeader>
    
                <CardContent className="px-8 pb-8 space-y-10">
                  {/* GUIDED ROUTE VISUALIZER */}
                  <div className="relative pl-10 space-y-10 before:content-[''] before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-[3px] before:bg-muted/20 before:rounded-full">
                    <div className="relative group">
                      <div className={cn(
                        "absolute -left-[35px] size-6 rounded-full ring-4 transition-all duration-500 z-10",
                        ['en_ruta_origen', 'en_origen', 'en_ruta_destino', 'en_destino', 'completado'].includes(servicio.estado)
                          ? "bg-secondary ring-secondary/10"
                          : "bg-muted ring-muted/10 group-hover:scale-110"
                      )} />
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Punto de Retiro</p>
                        <p className="text-xl font-bold text-foreground leading-tight">{servicio.origen}</p>
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <div className={cn(
                        "absolute -left-[35px] size-6 rounded-full ring-4 transition-all duration-500 z-10",
                        servicio.estado === 'completado'
                          ? "bg-primary ring-primary/10"
                          : "bg-muted ring-muted/10 group-hover:scale-110"
                      )} />
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Disposición Final</p>
                        <p className="text-xl font-bold text-foreground leading-tight">{servicio.destino}</p>
                      </div>
                    </div>
                  </div>
    
                  {/* TECHNICAL CONTEXT AREA */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/20 p-5 rounded-3xl border border-muted/30 shadow-sm flex flex-col gap-1">
                        <p className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em] mb-1">Carga</p>
                        <p className="text-sm font-bold truncate text-foreground/80">{servicio.carga || 'No especificada'}</p>
                    </div>
                    <div className="bg-muted/20 p-5 rounded-3xl border border-muted/30 shadow-sm flex flex-col gap-1">
                        <p className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em] mb-1">Vehículo</p>
                        <p className="text-sm font-bold truncate uppercase text-foreground/80">{tipoVehiculo === 'CAMION' ? 'Simple' : 'Camión/Carro'}</p>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="px-8 pb-10 pt-2 flex flex-col gap-4">
                  {servicio.estado === 'pendiente' && (
                    <Button 
                        className="w-full h-18 bg-secondary hover:bg-secondary/90 text-white rounded-[2rem] text-xl font-black shadow-2xl shadow-secondary/30 active:scale-[0.96] transition-all group" 
                        onClick={handleAcceptTrip} 
                        disabled={isLoading}
                    >
                      <Navigation2 className="size-6 mr-4 fill-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      INICIAR RUTA
                    </Button>
                  )}
                  
                  {servicio.estado === 'en_ruta_origen' && (
                    <Button 
                        className="w-full h-18 bg-primary hover:bg-primary/90 text-white rounded-[2rem] text-xl font-black shadow-2xl shadow-primary/30 active:scale-[0.96] transition-all" 
                        onClick={() => router.push(`/mobile/registro?servicio_id=${servicio.id}`)}
                    >
                        <FileText className="size-6 mr-4" />
                        REGISTRAR CARGA
                    </Button>
                  )}
    
                  {servicio.estado === 'completado' && (
                    <div className="w-full py-6 px-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center gap-4 shadow-sm">
                       <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-full">
                          <Truck className="size-5 text-emerald-600 dark:text-emerald-400" />
                       </div>
                       <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.2em]">Servicio Finalizado</p>
                    </div>
                  )}
    
                  <button 
                    className="w-full py-4 text-destructive hover:text-white hover:bg-destructive rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 mt-2"
                    onClick={() => setIsFallaModalOpen(true)}
                  >
                    <AlertTriangle className="size-4" />
                    Reportar Problema Técnico
                  </button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={isFallaModalOpen} onOpenChange={setIsFallaModalOpen}>
        <DialogContent className="sm:max-w-md w-[92%] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-destructive p-6 flex flex-col items-center gap-2 text-white text-center">
            <div className="bg-white/20 p-3 rounded-full mb-1">
              <AlertTriangle className="size-8" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Reportar Falla</DialogTitle>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest ml-1 text-muted-foreground">Descripción del problema</Label>
              <Textarea 
                placeholder="Ej: El motor presenta ruidos anómalos, neumático delantero izquierdo con baja presión, etc."
                value={observacionFalla}
                onChange={(e) => setObservacionFalla(e.target.value)}
                className="min-h-[120px] rounded-2xl border-muted bg-muted/20 focus:ring-destructive/30"
              />
            </div>
          </div>
          
          <div className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold text-muted-foreground" onClick={() => setIsFallaModalOpen(false)}>
              ATRÁS
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1 h-12 rounded-xl font-black shadow-lg shadow-destructive/20" 
              onClick={handleReportarFalla}
              disabled={isSubmittingFalla || !observacionFalla.trim()}
            >
              {isSubmittingFalla ? "ENVIANDO..." : "REPORTAR"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </main>
    </div>
  )
}
