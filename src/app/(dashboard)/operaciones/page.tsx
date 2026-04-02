"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Input } from "@/components/uib/input"
import { Label } from "@/components/uib/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/uib/select"
import { Badge } from "@/components/uib/badge"
import { Plus, List, Calendar as CalendarIcon, Truck, User, Clock, XCircle, ArrowRight, Info, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/uib/dialog"
import CalendarComponent from "@/components/CalendarComponent"
import { NavigationHeader } from "@/components/NavigationHeader"
import { cn } from "@/lib/utils"
import { useOfflineSync } from "@/hooks/useOfflineSync"
import { motion, AnimatePresence } from "framer-motion"

export default function AdminPage() {
  const { isOnline, addToOfflineQueue } = useOfflineSync()
  const [activeTab, setActiveTab] = useState("calendar")
  const [servicios, setServicios] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [anularTarget, setAnularTarget] = useState<any>(null)
  const [isAnulando, setIsAnulando] = useState(false)

  // Form states
  const [origen, setOrigen] = useState("")
  const [destino, setDestino] = useState("")
  const [carga, setCarga] = useState("")
  const [categoriaResiduo, setCategoriaResiduo] = useState("")
  const [tipoContenedor, setTipoContenedor] = useState("")
  const [choferId, setChoferId] = useState("")
  const [vehiculoId, setVehiculoId] = useState("")
  const [fechaPlanificacion, setFechaPlanificacion] = useState(new Date().toISOString().split('T')[0])
  const [bonoTipoVehiculo, setBonoTipoVehiculo] = useState<string>("CAMION")

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('public:servicios_planificacion')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicios_asignados' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const resServs = await fetch('/api/proxy', {
        method: 'POST',
        body: JSON.stringify({
          table: 'servicios_asignados',
          method: 'select',
          data: '*, usuarios:chofer_id (id, nombre), vehiculos:vehiculo_id (id, patente, tipo)'
        })
      })
      const { data: servs } = await resServs.json()
      
      const resUsrs = await fetch('/api/proxy', {
        method: 'POST',
        body: JSON.stringify({
          table: 'usuarios',
          method: 'select',
          match: { rol: 'chofer' }
        })
      })
      const { data: usrs } = await resUsrs.json()
      
      const resVehs = await fetch('/api/proxy', {
        method: 'POST',
        body: JSON.stringify({
          table: 'vehiculos',
          method: 'select'
        })
      })
      const { data: vehs } = await resVehs.json()
      
      const resClis = await fetch('/api/proxy', {
        method: 'POST',
        body: JSON.stringify({
          table: 'clientes',
          method: 'select'
        })
      })
      const { data: clis } = await resClis.json()

      if (servs) setServicios(servs)
      if (usrs) setUsuarios(usrs)
      if (vehs) setVehiculos(vehs)
      if (clis) setClientes(clis)
    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddServicio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!choferId || !vehiculoId || !origen || !destino) return

    const servicioData = {
      chofer_id: choferId,
      vehiculo_id: vehiculoId,
      origen,
      destino,
      carga: categoriaResiduo ? `${categoriaResiduo} - ${tipoContenedor}` : carga,
      tipo_servicio: "RETIRO",
      fecha: fechaPlanificacion,
      estado: 'pendiente',
      bono_tipo_vehiculo: bonoTipoVehiculo
    }

    try {
      if (!isOnline) {
        addToOfflineQueue('servicios_asignados', servicioData)
        alert("Modo Offline activo. Se sincronizará al recuperar conexión.")
      } else {
        const res = await fetch('/api/proxy', {
          method: 'POST',
          body: JSON.stringify({
            table: 'servicios_asignados',
            method: 'insert',
            data: [servicioData]
          })
        })
        if (!res.ok) throw new Error("Error al guardar")
      }
      
      setOrigen("")
      setDestino("")
      setCarga("")
      setCategoriaResiduo("")
      setTipoContenedor("")
      setChoferId("")
      setVehiculoId("")
      
      if (isOnline) fetchData()
    } catch (err: any) {
      console.error("Error:", err)
    }
  }

  const handleAnularViaje = async () => {
    if (!anularTarget) return
    setIsAnulando(true)
    try {
      await fetch('/api/proxy', {
        method: 'POST',
        body: JSON.stringify({
          table: 'servicios_asignados',
          method: 'update',
          data: { estado: 'anulado' },
          match: { id: anularTarget.id }
        })
      })
      setAnularTarget(null)
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setIsAnulando(false)
    }
  }

  const serviciosHoy = servicios.filter(s => s.fecha === new Date().toISOString().split('T')[0])

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary selection:text-white">
      <NavigationHeader title="Centro de Control" subtitle="Tresol Logistics & Operations" />
      
      <main className="p-6 md:p-12 max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              Planificación <span className="text-primary italic">Operativa</span>
            </h1>
            <p className="text-muted-foreground font-semibold text-lg flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Monitoreo y Despacho en Tiempo Real
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex glass p-1.5 rounded-3xl"
          >
            {[
              { id: "calendar", label: "Calendario", icon: CalendarIcon },
              { id: "list", label: "Hoy", icon: List }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all relative overflow-hidden",
                  activeTab === tab.id 
                    ? "text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="tab-bg"
                    className="absolute inset-0 bg-primary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon className="size-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </motion.div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Sidebar Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4"
          >
            <Card className="glass border-none overflow-hidden rounded-[2.5rem]">
              <CardHeader className="bg-secondary p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                <div className="flex items-center gap-4 mb-3">
                   <div className="p-3 bg-white/20 rounded-2xl">
                      <Plus className="size-6" />
                   </div>
                   <CardTitle className="text-2xl font-black uppercase tracking-tight">Nueva Ruta</CardTitle>
                </div>
                <CardDescription className="text-white/70 font-bold">Programación inteligente de flota.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                <form onSubmit={handleAddServicio} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fecha de Planificación</Label>
                    <Input 
                      type="date" 
                      value={fechaPlanificacion} 
                      onChange={(e) => setFechaPlanificacion(e.target.value)} 
                      className="h-14 rounded-2xl bg-muted/50 border-none font-bold focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asignar Personal</Label>
                      <Select value={choferId} onValueChange={(v: string) => setChoferId(v || "")}>
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none font-bold">
                          <SelectValue placeholder="Conductor..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl border-none">
                          {usuarios.map((u) => (
                            <SelectItem key={u.id} value={u.id} className="py-4 font-black">{u.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Vehículo</Label>
                      <Select value={vehiculoId} onValueChange={(v: string) => {
                        setVehiculoId(v || "")
                        const veh = vehiculos.find(vh => vh.id === v)
                        if (veh) setBonoTipoVehiculo(veh.tipo)
                      }}>
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none font-bold">
                          <SelectValue placeholder="Patente..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl border-none">
                          {vehiculos.map((v) => (
                            <SelectItem key={v.id} value={v.id} className="py-4 font-black uppercase">
                              {v.patente} <span className="text-[10px] opacity-50 ml-2">({v.tipo})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Origen / Cliente</Label>
                     <Select value={origen} onValueChange={(v: string) => { setOrigen(v || ""); setDestino(""); }}>
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none font-bold">
                           <SelectValue placeholder="Seleccione Origen..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl border-none">
                           {Array.from(new Set(clientes.map(c => c.nombre))).map((nombre) => (
                              <SelectItem key={nombre} value={nombre} className="py-4 font-black">{nombre}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>

                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Disposición Final</Label>
                     <Select value={destino} disabled={!origen} onValueChange={(v: string) => setDestino(v || "")}>
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none font-bold">
                           <SelectValue placeholder={origen ? "Seleccione Destino..." : "Esperando origen..."} />
                        </SelectTrigger>
                         <SelectContent className="rounded-2xl shadow-2xl border-none">
                            {Array.from(new Set(clientes.filter(c => c.nombre === origen).map(c => c.disposicion_final))).map((final, idx) => (
                               <SelectItem key={idx} value={final} className="py-4 font-black">{final}</SelectItem>
                            ))}
                         </SelectContent>
                     </Select>
                  </div>

                  <Button type="submit" className="w-full h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                     Confirmar Despacho
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {activeTab === "calendar" ? (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="glass rounded-[3rem] h-[650px] overflow-hidden"
                >
                  <CalendarComponent services={servicios} />
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  className="space-y-6"
                >
                  {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="h-32 bg-muted rounded-[2.5rem] animate-pulse" />
                    ))
                  ) : serviciosHoy.length === 0 ? (
                    <Card className="h-96 flex flex-col items-center justify-center border-dashed border-2 rounded-[3rem] bg-muted/20">
                       <Clock className="size-20 text-muted mb-6 opacity-40" />
                       <h3 className="text-2xl font-black text-muted-foreground uppercase tracking-tight">Sin rutas para hoy</h3>
                       <p className="text-sm text-muted-foreground font-bold mt-2">Usa el panel de la izquierda para comenzar.</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {serviciosHoy.map((s, idx) => (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card className="group border-none glass hover:bg-white hover:shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-500">
                            <div className="flex flex-col md:flex-row">
                              <div className="p-10 md:w-2/3 space-y-6">
                                <div className="flex items-center gap-4">
                                  <Badge className={cn(
                                    "px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase shadow-sm",
                                    s.estado === 'pendiente' ? "bg-amber-100 text-amber-700" :
                                    s.estado === 'completado' ? "bg-emerald-100 text-emerald-700" :
                                    "bg-blue-100 text-blue-700"
                                  )}>
                                    {s.estado}
                                  </Badge>
                                  <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-widest">
                                    <Clock className="size-3.5" />
                                    {new Date(s.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Ruta Planificada</p>
                                  <div className="flex items-center gap-4 text-2xl font-black text-foreground">
                                    <span>{s.origen}</span>
                                    <ArrowRight className="size-6 text-primary" />
                                    <span className="text-secondary">{s.destino}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="p-10 md:w-1/3 bg-muted/30 border-l border-muted flex flex-col justify-center space-y-5">
                                <div className="flex items-center gap-4">
                                  <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                    <User className="size-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Conductor</p>
                                    <p className="font-black text-sm">{s.usuarios?.nombre || 'TBD'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                    <Truck className="size-5 text-secondary" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Patente</p>
                                    <p className="font-black text-sm uppercase">{s.vehiculos?.patente || 'TBD'}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-4 flex items-center justify-center bg-white/50 border-l border-muted">
                                 {s.estado === 'pendiente' && (
                                   <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setAnularTarget(s)}
                                    className="size-12 rounded-2xl text-destructive hover:bg-destructive/10 transition-colors"
                                   >
                                      <XCircle className="size-6" />
                                   </Button>
                                 )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Dialog open={!!anularTarget} onOpenChange={() => setAnularTarget(null)}>
        <DialogContent className="rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
           <div className="bg-destructive p-10 text-white text-center flex flex-col items-center gap-4">
              <div className="p-4 bg-white/20 rounded-full">
                 <Info className="size-10" />
              </div>
              <DialogTitle className="text-3xl font-black uppercase tracking-tight">Anular Servicio</DialogTitle>
              <DialogDescription className="text-white/80 font-bold">Esta ruta será marcada como cancelada y no podrá ser reactivada.</DialogDescription>
           </div>
           <div className="p-10 flex gap-4">
              <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black" onClick={() => setAnularTarget(null)}>No, volver</Button>
              <Button variant="destructive" className="flex-1 h-14 rounded-2xl font-black shadow-xl shadow-destructive/20" onClick={handleAnularViaje} disabled={isAnulando}>
                 Confirmar Anulación
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}