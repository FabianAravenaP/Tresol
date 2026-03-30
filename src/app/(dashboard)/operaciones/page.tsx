"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, List, Calendar as CalendarIcon, Truck, User, MapPin, Package, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import CalendarComponent from "@/components/CalendarComponent"
import { NavigationHeader } from "@/components/NavigationHeader"
import { cn } from "@/lib/utils"
import { useOfflineSync } from "@/hooks/useOfflineSync"

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

    // Real-time synchronization
    const channel = supabase
      .channel('public:servicios_planificacion')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicios_asignados' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehiculos' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios', filter: "rol=eq.chofer" }, () => {
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
          data: `
            *,
            usuarios:chofer_id (id, nombre),
            vehiculos:vehiculo_id (id, patente, tipo)
          `
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
      tipo_servicio: "RETIRO", // Hardcoded default to satisfy DB without changing UI
      fecha: fechaPlanificacion,
      estado: 'pendiente',
      bono_tipo_vehiculo: bonoTipoVehiculo
    }

    try {
      if (!isOnline) {
        addToOfflineQueue('servicios_asignados', servicioData)
        alert("Sin conexión. La asignación se ha guardado localmente y se sincronizará automáticamente al recuperar internet.")
      } else {
        const res = await fetch('/api/proxy', {
          method: 'POST',
          body: JSON.stringify({
            table: 'servicios_asignados',
            method: 'insert',
            data: [servicioData]
          })
        })
        if (!res.ok) {
           const errBody = await res.json()
           throw new Error(errBody.error || "Error al guardar en base de datos")
        }
      }
      
      // Reset form
      setOrigen("")
      setDestino("")
      setCarga("")
      setCategoriaResiduo("")
      setTipoContenedor("")
      setChoferId("")
      setVehiculoId("")
      setBonoTipoVehiculo("CAMION")
      
      if (isOnline) fetchData()
    } catch (err: any) {
      console.error("Error adding service:", err)
      // Fallback to offline queue if request fails
      addToOfflineQueue('servicios_asignados', servicioData)
      alert(`Error: ${err.message || "Error de conexión"}. Se guardó localmente.`)
    }
  }

  const handleAnularViaje = async () => {
    if (!anularTarget) return
    setIsAnulando(true)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        body: JSON.stringify({
          table: 'servicios_asignados',
          method: 'update',
          data: { estado: 'anulado' },
          match: { id: anularTarget.id }
        })
      })
      const { error } = await res.json()
      if (error) throw new Error(error)
      setAnularTarget(null)
      fetchData()
    } catch (err: any) {
      console.error("Error anulando viaje:", err)
      alert(`Error al anular: ${err.message || "Intente nuevamente"}`)
    } finally {
      setIsAnulando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0] dark:bg-zinc-950">
      <NavigationHeader title="Planificación Operativa" subtitle="Centro de Control Tresol" />
      
      <main className="p-8 md:p-10 max-w-7xl mx-auto">
        <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-[#323232]">Planificación Operativa</h2>
          <p className="text-muted-foreground font-medium text-lg">Centro de Control y Despacho Tresol</p>
        </div>
        
        <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl shadow-inner border border-muted dark:bg-zinc-900/50">
          <button
            onClick={() => setActiveTab("calendar")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm uppercase tracking-widest",
              activeTab === "calendar" 
                ? "bg-[#51872E] text-white shadow-lg shadow-[#51872E]/20" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarIcon className="size-4" />
            Calendario
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm uppercase tracking-widest",
              activeTab === "list" 
                ? "bg-[#51872E] text-white shadow-lg shadow-[#51872E]/20" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-4" />
            Hoy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Form: Nueva Asignación */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-2xl border-none ring-1 ring-black/5 rounded-[2rem] overflow-hidden bg-white/90 backdrop-blur-md">
            <CardHeader className="bg-[#116CA2] text-white p-8">
              <div className="flex items-center gap-3 mb-2">
                 <Plus className="size-6" />
                 <CardTitle className="text-2xl font-black tracking-tight">Nueva Asignación</CardTitle>
              </div>
              <CardDescription className="text-blue-100 font-medium opacity-90">Programación de servicios y rutas.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-5">
              <form onSubmit={handleAddServicio} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fecha Programada</Label>
                  <Input 
                    type="date" 
                    value={fechaPlanificacion} 
                    onChange={(e) => setFechaPlanificacion(e.target.value)} 
                    className="h-12 rounded-xl border-muted bg-zinc-50 focus:ring-2 focus:ring-[#116CA2]/20 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Conductor Responsable</Label>
                    <Select value={choferId} onValueChange={(v) => setChoferId(v || "")}>
                      <SelectTrigger className="h-12 rounded-xl border-muted bg-zinc-50 font-bold">
                        <SelectValue placeholder="Seleccionar...">
                           {usuarios.find(u => u.id === choferId)?.nombre}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-muted shadow-xl">
                        {usuarios.map((u) => (
                          <SelectItem key={u.id} value={u.id} className="py-3 font-semibold">{u.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Vehículo Asignado</Label>
                    <Select value={vehiculoId} onValueChange={(v) => setVehiculoId(v || "")}>
                      <SelectTrigger className="h-12 rounded-xl border-muted bg-zinc-50 font-bold">
                        <SelectValue placeholder="Seleccionar...">
                           {vehiculos.find(v => v.id === vehiculoId)?.patente}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-muted shadow-xl">
                        {vehiculos.map((v) => (
                          <SelectItem key={v.id} value={v.id} className="py-3 font-semibold">
                            {v.patente} ({v.tipo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo para Bono</Label>
                  <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-xl border border-muted">
                     <button 
                        type="button"
                        onClick={() => setBonoTipoVehiculo("CAMION")}
                        className={cn(
                           "py-2 px-3 text-[10px] font-black uppercase rounded-lg transition-all",
                           bonoTipoVehiculo === "CAMION" ? "bg-white shadow text-[#116CA2] shadow-sm" : "text-muted-foreground hover:bg-white/50"
                        )}
                     >
                        C. Simple
                     </button>
                     <button 
                        type="button"
                        onClick={() => setBonoTipoVehiculo("CAMION+CARRO")}
                        className={cn(
                           "py-2 px-3 text-[10px] font-black uppercase rounded-lg transition-all",
                           bonoTipoVehiculo === "CAMION+CARRO" ? "bg-white shadow text-[#116CA2] shadow-sm" : "text-muted-foreground hover:bg-white/50"
                        )}
                     >
                        C. + Carro
                     </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ruta Origen</Label>
                    <Select value={origen} onValueChange={(v) => {
                      setOrigen(v || "")
                      setDestino("") // Reset destination when origin changes
                    }}>
                      <SelectTrigger className="h-12 rounded-xl border-muted bg-zinc-50 font-bold">
                        <SelectValue placeholder="Seleccionar Origen..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-muted shadow-xl">
                        {Array.from(new Set(clientes.map(c => c.nombre))).map((nombre) => (
                          <SelectItem key={nombre} value={nombre} className="py-3 font-semibold">{nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ruta Destino</Label>
                    <Select 
                      key={origen} // Force re-mount when origin changes
                      value={destino} 
                      onValueChange={(v) => setDestino(v || "")}
                    >
                      <SelectTrigger 
                        disabled={!origen}
                        className="h-12 rounded-xl border-muted bg-zinc-50 font-bold"
                      >
                        <SelectValue placeholder={origen ? "Seleccionar Destino..." : "Seleccione Origen Primero"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-muted shadow-xl">
                        {clientes
                          .filter(c => c.nombre === origen)
                          .map((c, idx) => (
                            <SelectItem key={`${c.disposicion_final}-${idx}`} value={c.disposicion_final} className="py-3 font-semibold">
                              {c.disposicion_final}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Categoría RISES</Label>
                    <Select value={categoriaResiduo} onValueChange={(v) => setCategoriaResiduo(v || "")}>
                      <SelectTrigger className="h-12 rounded-xl border-muted bg-zinc-50 font-bold">
                        <SelectValue placeholder="Tipo de Residuo..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-muted shadow-xl">
                        <SelectItem value="Asimilables" className="py-3 font-semibold">Asimilables</SelectItem>
                        <SelectItem value="Lodos" className="py-3 font-semibold">Lodos</SelectItem>
                        <SelectItem value="Escombros" className="py-3 font-semibold">Escombros</SelectItem>
                        <SelectItem value="Residuos Peligrosos" className="py-3 font-semibold">Residuos Peligrosos</SelectItem>
                        <SelectItem value="Residuos Industriales" className="py-3 font-semibold">Residuos Industriales</SelectItem>
                        <SelectItem value="Residuos Valorizables" className="py-3 font-semibold">Residuos Valorizables</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo Contenedor</Label>
                    <Select value={tipoContenedor} onValueChange={(v) => setTipoContenedor(v || "")}>
                      <SelectTrigger className="h-12 rounded-xl border-muted bg-zinc-50 font-bold">
                        <SelectValue placeholder="Seleccionar Contenedor..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-muted shadow-xl">
                        <SelectItem value="Compactador Estacionario" className="py-3 font-semibold">Compactador Estacionario</SelectItem>
                        <SelectItem value="Contenedor cerrado" className="py-3 font-semibold">Contenedor cerrado</SelectItem>
                        <SelectItem value="Contenedor abierto" className="py-3 font-semibold">Contenedor abierto</SelectItem>
                        <SelectItem value="Estanque algibe o lodo" className="py-3 font-semibold">Estanque algibe o lodo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Notas Adicionales</Label>
                  <Input 
                    placeholder="Ej: Lodos, Industriales, etc." 
                    value={carga} 
                    onChange={(e) => setCarga(e.target.value)} 
                    className="h-12 rounded-xl border-muted bg-zinc-50 font-bold"
                  />
                </div>

                <Button type="submit" className="w-full h-14 rounded-2xl bg-[#51872E] hover:bg-[#406B24] text-white font-black shadow-lg shadow-[#51872E]/20 transition-all active:scale-[0.98] mt-4">
                   CONFIRMAR ASIGNACIÓN
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Main Area: Calendar or List */}
        <div className="lg:col-span-8">
          {activeTab === "calendar" ? (
            <Card className="shadow-2xl border-none ring-1 ring-black/5 rounded-[2rem] overflow-hidden bg-white/90 backdrop-blur-md h-full">
              <CalendarComponent services={servicios} />
            </Card>
          ) : (
            <div className="space-y-4 h-full">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-[2rem]" />
                ))
              ) : servicios.filter(s => s.fecha === new Date().toISOString().split('T')[0]).length === 0 ? (
                <Card className="h-full flex flex-col items-center justify-center p-12 border-dashed border-2 rounded-[2rem] bg-zinc-50/50">
                   <Clock className="size-16 text-muted mb-4 opacity-20" />
                   <h3 className="text-xl font-black text-muted-foreground">Sin servicios para hoy</h3>
                   <p className="text-sm text-muted-foreground font-medium text-center max-w-xs mt-2">La lista está vacía. Comience programando una ruta desde el panel lateral.</p>
                </Card>
              ) : (
                servicios
                  .filter(s => s.fecha === new Date().toISOString().split('T')[0])
                  .map((s) => (
                    <Card key={s.id} className="shadow-sm hover:shadow-xl transition-all border-none ring-1 ring-black/5 rounded-[2rem] bg-white group overflow-hidden">
                      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-muted/30">
                        <div className="p-8 md:w-2/3 space-y-4">
                           <div className="flex items-center gap-3">
                              <Badge className={cn(
                                "rounded-full px-3 py-1 font-black text-[10px] tracking-widest uppercase",
                                s.estado === 'pendiente' ? "bg-amber-100 text-amber-700" :
                                s.estado === 'completado' ? "bg-emerald-100 text-emerald-700" :
                                s.estado === 'anulado' ? "bg-red-100 text-red-700" :
                                "bg-blue-100 text-blue-700"
                              )}>
                                {s.estado}
                              </Badge>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <Clock className="size-3" />
                                {new Date(s.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>

                           <div className="flex items-center gap-8">
                             <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase text-muted-foreground">Ruta</p>
                                <div className="flex items-center gap-3 font-bold text-[#323232]">
                                   <span>{s.origen}</span>
                                   <div className="h-px w-8 bg-muted" />
                                   <span className="text-[#116CA2]">{s.destino}</span>
                                </div>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase text-muted-foreground">Carga</p>
                                <p className="font-bold text-[#323232]">{s.carga || 'General'}</p>
                             </div>
                           </div>
                        </div>

                        <div className="p-8 md:w-1/3 bg-zinc-50/50 flex flex-col justify-center space-y-3">
                           <div className="flex items-center gap-3">
                              <div className="bg-white p-2 rounded-lg shadow-sm">
                                 <User className="size-4 text-[#51872E]" />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-[8px] font-black uppercase text-muted-foreground leading-none mb-1">Conductor</p>
                                 <p className="font-bold text-sm truncate">{s.usuarios?.nombre || 'TBD'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="bg-white p-2 rounded-lg shadow-sm">
                                 <Truck className="size-4 text-[#116CA2]" />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-[8px] font-black uppercase text-muted-foreground leading-none mb-1">Vehículo</p>
                                 <p className="font-bold text-sm truncate uppercase">{s.vehiculos?.patente || 'TBD'} <span className="text-[10px] text-muted-foreground ml-1">({s.vehiculos?.tipo})</span></p>
                              </div>
                           </div>
                        </div>

                        <div className="p-4 flex flex-col items-center justify-center bg-white group-hover:bg-red-50/30 transition-colors min-w-[80px]">
                           {s.estado !== 'anulado' && s.estado !== 'completado' ? (
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => setAnularTarget(s)}
                               className="rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 font-black text-xs uppercase tracking-wider h-auto px-3 py-2 gap-1.5"
                             >
                               <XCircle className="size-4" />
                               Anular
                             </Button>
                           ) : (
                             <div className={cn(
                               "text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg text-center",
                               s.estado === 'completado' ? "text-emerald-500 bg-emerald-50" : "text-red-400 bg-red-50"
                             )}>
                               {s.estado === 'completado' ? 'Completado' : 'Anulado'}
                             </div>
                           )}
                        </div>
                      </div>
                    </Card>
                  ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---- Anular Confirmation Dialog ---- */}
      <Dialog open={!!anularTarget} onOpenChange={(open) => { if (!open) setAnularTarget(null) }}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-red-600 p-8 flex flex-col items-center gap-3 text-white text-center">
            <div className="bg-white/20 p-3 rounded-full">
              <XCircle className="size-8" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Anular Viaje</DialogTitle>
            <DialogDescription className="text-red-100 font-medium">
              Esta acción es irreversible. El viaje quedará marcado como anulado.
            </DialogDescription>
          </div>
          <div className="p-8 space-y-4">
            {anularTarget && (
              <div className="bg-red-50 rounded-2xl p-4 space-y-1 text-sm">
                <p className="font-black text-red-800 uppercase text-xs tracking-wider">Servicio a anular</p>
                <p className="font-bold text-[#323232]">{anularTarget.origen} → {anularTarget.destino}</p>
                <p className="text-muted-foreground font-medium">Conductor: {anularTarget.usuarios?.nombre || 'Sin asignar'}</p>
              </div>
            )}
            <DialogFooter className="flex gap-3 sm:flex-row">
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setAnularTarget(null)}>
                CANCELAR
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-12 rounded-xl font-black shadow-lg shadow-red-500/20"
                onClick={handleAnularViaje}
                disabled={isAnulando}
              >
                {isAnulando ? 'ANULANDO...' : 'CONFIRMAR ANULACIÓN'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </div>
  )
}
