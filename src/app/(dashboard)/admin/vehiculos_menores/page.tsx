"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Input } from "@/components/uib/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/uib/table"
import { Badge } from "@/components/uib/badge"
import { 
  Plus, 
  Search, 
  Check, 
  X, 
  Calendar, 
  Car, 
  User, 
  Clock, 
  AlertTriangle,
  Fuel,
  Gauge,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  MoreVertical,
  History,
  Eye
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from "@/components/uib/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/uib/tabs"

export default function VehiculosMenoresAdmin() {
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pendientes")
  const [detailModal, setDetailModal] = useState<{isOpen: boolean, solicitud: any | null}>({isOpen: false, solicitud: null})
  const [actionModal, setActionModal] = useState<{isOpen: boolean, solicitud: any | null, action: 'APROBADA' | 'RECHAZADA' | null}>({isOpen: false, solicitud: null, action: null})
  const [approvalVehiculo, setApprovalVehiculo] = useState("")
  const [rejectionComment, setRejectionComment] = useState("")
  const [isActioning, setIsActioning] = useState(false)

  useEffect(() => {
    fetchSolicitudes()
    fetchVehiculos()
  }, [])

  const fetchVehiculos = async () => {
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'vehiculos',
          method: 'select',
          data: '*',
          match: { categoria: 'MENOR' }
        })
      })
      const { data, success } = await res.json()
      if (success) setVehiculos(data || [])
    } catch (e) {
      console.error("Error fetching fleet:", e)
    }
  }

  const fetchSolicitudes = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'solicitudes_vehiculos',
          method: 'select',
          data: `
            *,
            solicitante:usuario_id(nombre, apellido, rut, cargo),
            vehiculo:vehiculo_id(patente, marca, modelo, categoria)
          `
        })
      })
      
      const { data, error, success } = await res.json()
      if (!success) throw new Error(error)
      
      const sorted = (data || []).sort((a:any, b:any) => new Date(b.created_at || new Date()).getTime() - new Date(a.created_at || new Date()).getTime())
      setSolicitudes(sorted)
    } catch (error) {
      console.error("Error fetching solicitudes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openActionModal = (solicitud: any, action: 'APROBADA' | 'RECHAZADA') => {
    setApprovalVehiculo(solicitud.vehiculo_id ?? "")
    setRejectionComment("")
    setActionModal({ isOpen: true, solicitud, action })
  }

  const confirmAction = async () => {
    if (!actionModal.solicitud || !actionModal.action) return
    setIsActioning(true)
    try {
      const sessionStr = localStorage.getItem('tresol_session')
      const user = sessionStr ? JSON.parse(sessionStr) : null

      const updateData: any = {
        estado_solicitud: actionModal.action,
        aprobado_por: user?.persona_id ?? user?.id
      }
      if (actionModal.action === 'APROBADA' && approvalVehiculo) {
        updateData.vehiculo_id = approvalVehiculo
      }
      if (actionModal.action === 'RECHAZADA' && rejectionComment.trim()) {
        updateData.comentarios_admin = rejectionComment.trim()
      }

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'solicitudes_vehiculos',
          method: 'update',
          data: updateData,
          match: { id: actionModal.solicitud.id }
        })
      })

      const { error, success } = await res.json()
      if (!success) throw new Error(error)
      setActionModal({ isOpen: false, solicitud: null, action: null })
      fetchSolicitudes()
    } catch (error) {
      console.error("Error updating solicitud:", error)
      alert("Error al procesar la solicitud")
    } finally {
      setIsActioning(false)
    }
  }

  const updateVehicleEstado = async (vehiculoId: string, nuevoEstado: string) => {
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'vehiculos',
          method: 'update',
          data: { estado: nuevoEstado },
          match: { id: vehiculoId }
        })
      })
      const { success, error } = await res.json()
      if (!success) throw new Error(error)
      setVehiculos(prev => prev.map(v => v.id === vehiculoId ? { ...v, estado: nuevoEstado } : v))
    } catch (e) {
      console.error("Error actualizando estado:", e)
      alert("No se pudo actualizar el estado del vehículo")
    }
  }

  const setAllMenoresOperativo = async () => {
    const menores = vehiculos.filter((v: any) => v.categoria === 'MENOR' && v.estado !== 'OPERATIVO')
    if (menores.length === 0) return alert("Todos los vehículos menores ya están OPERATIVOS.")
    if (!confirm(`¿Marcar ${menores.length} vehículo(s) como OPERATIVO?`)) return
    await Promise.all(menores.map((v: any) => updateVehicleEstado(v.id, 'OPERATIVO')))
  }

  const isWeekend = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDay()
    return day === 0 || day === 6
  }

  const isOverdue = (s: any) =>
    s.estado_solicitud === 'EN_USO' && new Date(s.fecha_fin) < new Date()

  const filteredSolicitudes = solicitudes.filter(s => {
    const matchesSearch = 
      `${s.solicitante?.nombre} ${s.solicitante?.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.vehiculo?.patente.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeTab === 'pendientes') return matchesSearch && s.estado_solicitud === 'PENDIENTE'
    if (activeTab === 'activas') return matchesSearch && (s.estado_solicitud === 'APROBADA' || s.estado_solicitud === 'EN_USO')
    if (activeTab === 'historial') return matchesSearch && (s.estado_solicitud === 'FINALIZADA' || s.estado_solicitud === 'RECHAZADA')
    return matchesSearch
  })

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#323232] dark:text-white tracking-tight flex items-center gap-3">
            <Car className="size-8 text-[#116CA2]" />
            Control de Vehículos Menores
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-500 font-medium">Gestión de camionetas y autos para personal administrativo y operativo.</p>
            <div className="h-4 w-px bg-slate-200" />
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
               <AlertTriangle className="size-3" />
               <span>Fines de Semana requieren Sandra/Natali</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-[10px] font-black text-[#116CA2] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
               <Car className="size-3" />
               <span>Total Flota Menor: {vehiculos.filter((v: any) => v.categoria === 'MENOR').length}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pendientes" onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <TabsList className="bg-slate-100/50 p-1 rounded-2xl border border-slate-100">
            <TabsTrigger value="pendientes" className="rounded-xl px-6 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#116CA2] data-[state=active]:shadow-sm">
               Pendientes ({solicitudes.filter(s => s.estado_solicitud === 'PENDIENTE').length})
            </TabsTrigger>
            <TabsTrigger value="activas" className="rounded-xl px-6 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#116CA2] data-[state=active]:shadow-sm">
               En Curso ({solicitudes.filter(s => ['APROBADA', 'EN_USO'].includes(s.estado_solicitud)).length})
            </TabsTrigger>
            <TabsTrigger value="historial" className="rounded-xl px-6 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#116CA2] data-[state=active]:shadow-sm">
               Historial
            </TabsTrigger>
            <TabsTrigger value="flota" className="rounded-xl px-6 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#116CA2] data-[state=active]:shadow-sm">
               Flota ({vehiculos.filter((v: any) => v.categoria === 'MENOR').length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input 
              placeholder="Buscar por usuario o patente..." 
              className="pl-12 h-11 bg-white border-slate-200 rounded-2xl focus-visible:ring-[#116CA2]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {(['pendientes', 'activas', 'historial'] as const).map((tabValue) => (
        <TabsContent key={tabValue} value={tabValue} className="mt-0">
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-50 hover:bg-transparent">
                    <TableHead className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Vehículo / Usuario</TableHead>
                    <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Periodo / Motivo</TableHead>
                    <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Estado / KM</TableHead>
                    <TableHead className="px-8 py-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="py-20 text-center font-bold text-slate-300 italic">Cargando solicitudes...</TableCell></TableRow>
                  ) : filteredSolicitudes.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="py-20 text-center font-bold text-slate-300 italic">No hay solicitudes en esta categoría</TableCell></TableRow>
                  ) : filteredSolicitudes.map((s) => {
                    const needsSpecialAuth = isWeekend(s.fecha_inicio) || isWeekend(s.fecha_fin)
                    
                    return (
                      <TableRow key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="size-12 rounded-2xl bg-[#116CA2]/5 flex items-center justify-center">
                                 <Car className="size-6 text-[#116CA2]" />
                              </div>
                              <div>
                                 <p className="font-black text-[#323232] uppercase tracking-tight leading-none mb-1">
                                    {s.vehiculo?.patente ?? <span className="text-slate-300 font-medium italic text-xs normal-case">Sin asignar</span>}
                                 </p>
                                 <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                                    {s.solicitante?.nombre} {s.solicitante?.apellido}
                                 </p>
                                 <p className="text-[10px] font-medium text-slate-400 tracking-wide">
                                    {s.solicitante?.rut}{s.solicitante?.cargo ? ` · ${s.solicitante.cargo}` : ""}
                                 </p>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell className="py-6">
                           <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                 <Calendar className="size-3 text-[#116CA2]" />
                                 {new Date(s.fecha_inicio).toLocaleDateString()} {new Date(s.fecha_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 <span className="text-slate-300 mx-1">→</span>
                                 {new Date(s.fecha_fin).toLocaleDateString()} {new Date(s.fecha_fin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                              <div className="flex items-center gap-2">
                                 <Badge className={cn(
                                   "text-[9px] font-black border-none px-2 py-0.5 rounded-md",
                                   s.motivo === 'TRABAJO' ? "bg-blue-100 text-blue-600" :
                                   s.motivo === 'PERSONAL' ? "bg-purple-100 text-purple-600" : "bg-red-100 text-red-600"
                                 )}>
                                    {s.motivo}
                                 </Badge>
                                 {needsSpecialAuth && (
                                    <Badge className="bg-amber-100 text-amber-600 border-none text-[9px] font-black animate-pulse px-2 py-0.5 rounded-md flex items-center gap-1">
                                       <AlertTriangle className="size-3" />
                                       SANDRA/NATALI
                                    </Badge>
                                 )}
                              </div>
                           </div>
                        </TableCell>
                        <TableCell className="py-6">
                           <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={cn(
                                  "text-[9px] font-black border-none px-2 py-1 rounded-lg",
                                  s.estado_solicitud === 'PENDIENTE' ? "bg-amber-100 text-amber-600" :
                                  s.estado_solicitud === 'APROBADA' || s.estado_solicitud === 'EN_USO' ? "bg-emerald-100 text-emerald-600" :
                                  s.estado_solicitud === 'FINALIZADA' ? "bg-blue-100 text-blue-600" :
                                  "bg-slate-100 text-slate-400"
                                )}>
                                   {s.estado_solicitud}
                                </Badge>
                                {isOverdue(s) && (
                                  <Badge className="bg-red-100 text-red-600 border-none text-[9px] font-black animate-pulse px-2 py-1 rounded-lg flex items-center gap-1">
                                    <AlertTriangle className="size-3" /> VENCIDO
                                  </Badge>
                                )}
                              </div>
                              {s.km_salida && (
                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                                   <div className="flex items-center gap-1">
                                      <Gauge className="size-3" /> {s.km_salida} km
                                   </div>
                                   {s.combustible_salida != null && (
                                     <div className="flex items-center gap-1">
                                       <Fuel className="size-3" /> {s.combustible_salida}%
                                     </div>
                                   )}
                                </div>
                              )}
                              {s.km_retorno && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-3 text-[10px] font-bold text-blue-400">
                                     <div className="flex items-center gap-1">
                                        <Gauge className="size-3" /> {s.km_retorno} km (ret.)
                                     </div>
                                     {s.combustible_retorno != null && (
                                       <div className="flex items-center gap-1">
                                         <Fuel className="size-3" /> {s.combustible_retorno}%
                                       </div>
                                     )}
                                  </div>
                                  {s.limpieza && (
                                    <Badge className="text-[8px] font-black border-none px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                      {s.limpieza}
                                    </Badge>
                                  )}
                                  {s.danos_retorno_notas && (
                                    <p className="text-[9px] text-red-500 font-bold truncate max-w-[160px]">⚠ {s.danos_retorno_notas}</p>
                                  )}
                                </div>
                              )}
                           </div>
                        </TableCell>
                        <TableCell className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-2">
                             {s.estado_solicitud === 'PENDIENTE' ? (
                               <>
                                 <Button
                                   onClick={() => openActionModal(s, 'APROBADA')}
                                   className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-9 px-4 font-black text-[10px] tracking-widest shadow-lg shadow-emerald-500/20"
                                 >
                                    APROBAR
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   onClick={() => openActionModal(s, 'RECHAZADA')}
                                   className="text-red-500 hover:bg-red-50 rounded-xl h-9 px-4 font-black text-[10px] tracking-widest"
                                 >
                                    RECHAZAR
                                 </Button>
                               </>
                             ) : (
                               <Button variant="ghost" size="icon" onClick={() => setDetailModal({isOpen: true, solicitud: s})} className="h-9 w-9 rounded-xl text-slate-300 hover:text-[#116CA2] hover:bg-slate-100">
                                  <Eye className="size-4" />
                               </Button>
                             )}
                           </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        ))}
        <TabsContent value="flota" className="mt-0">
          <div className="flex justify-end mb-3">
            <Button
              onClick={setAllMenoresOperativo}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-9 px-5 font-black text-[10px] tracking-widest shadow-lg shadow-emerald-500/20"
            >
              Marcar todos OPERATIVO
            </Button>
          </div>
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-50 hover:bg-transparent">
                    <TableHead className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Vehículo</TableHead>
                    <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Categoría / Tipo</TableHead>
                    <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Estado</TableHead>
                    <TableHead className="px-8 py-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">N° Interno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehiculos.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="py-20 text-center font-bold text-slate-300 italic">Cargando flota...</TableCell></TableRow>
                  ) : vehiculos.filter((v: any) => v.categoria === 'MENOR').filter((v: any) =>
                    v.patente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    v.marca?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="py-20 text-center font-bold text-slate-300 italic">No se encontraron vehículos</TableCell></TableRow>
                  ) : vehiculos.filter((v: any) => v.categoria === 'MENOR').filter((v: any) =>
                    v.patente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    v.marca?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((v: any) => (
                    <TableRow key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-8 py-6 text-sm font-black text-[#323232] uppercase">
                        {v.patente} <span className="ml-2 font-bold text-slate-400 text-[10px]">{v.marca} {v.modelo}</span>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex gap-2">
                          <Badge className="bg-slate-100 text-slate-500 border-none text-[9px] font-black px-2 py-0.5 rounded-md">
                            {v.categoria || 'N/A'}
                          </Badge>
                          <Badge className="bg-slate-100 text-slate-500 border-none text-[9px] font-black px-2 py-0.5 rounded-md">
                            {v.tipo || 'N/A'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <select
                          value={v.estado || ''}
                          onChange={(e) => updateVehicleEstado(v.id, e.target.value)}
                          className={cn(
                            "text-[9px] font-black border-none px-2 py-1 rounded-lg outline-none cursor-pointer",
                            v.estado === 'OPERATIVO' ? "bg-emerald-100 text-emerald-600" :
                            v.estado === 'MANTENCION' ? "bg-amber-100 text-amber-600" :
                            "bg-red-100 text-red-600"
                          )}
                        >
                          <option value="OPERATIVO">OPERATIVO</option>
                          <option value="MANTENCION">MANTENCIÓN</option>
                          <option value="BAJA">BAJA</option>
                        </select>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-right font-black text-[#116CA2] text-xs">
                        {v.id_interno || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Action Confirmation Modal */}
      {actionModal.solicitud && (
        <Dialog open={actionModal.isOpen} onOpenChange={(open: boolean) => !open && setActionModal({isOpen: false, solicitud: null, action: null})}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl">
            <DialogHeader className="mb-6">
              <div className={`size-14 rounded-2xl flex items-center justify-center mb-4 ${actionModal.action === 'APROBADA' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                {actionModal.action === 'APROBADA'
                  ? <CheckCircle2 className="size-7 text-emerald-500" />
                  : <XCircle className="size-7 text-red-500" />}
              </div>
              <DialogTitle className="text-xl font-black text-[#323232] uppercase tracking-tight">
                {actionModal.action === 'APROBADA' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
              </DialogTitle>
              <DialogDescription className="font-bold text-slate-500">
                {actionModal.solicitud.solicitante?.nombre} {actionModal.solicitud.solicitante?.apellido}
                {actionModal.solicitud.motivo ? ` · ${actionModal.solicitud.motivo}` : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {actionModal.action === 'APROBADA' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Asignar Vehículo</label>
                  <select
                    value={approvalVehiculo}
                    onChange={(e) => setApprovalVehiculo(e.target.value)}
                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm outline-none focus:ring-2 focus:ring-[#116CA2]"
                  >
                    <option value="">Sin asignar (el usuario ya eligió)</option>
                    {vehiculos.filter((v: any) => v.categoria === 'MENOR' && v.estado === 'OPERATIVO').map((v: any) => (
                      <option key={v.id} value={v.id}>{v.patente} — {v.marca} {v.modelo}</option>
                    ))}
                  </select>
                </div>
              )}

              {actionModal.action === 'RECHAZADA' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Motivo de Rechazo</label>
                  <textarea
                    value={rejectionComment}
                    onChange={(e) => setRejectionComment(e.target.value)}
                    placeholder="Opcional — el solicitante verá este mensaje."
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm outline-none resize-none focus:ring-2 focus:ring-red-300"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button variant="ghost" onClick={() => setActionModal({isOpen: false, solicitud: null, action: null})} className="rounded-xl font-black text-slate-400">Cancelar</Button>
              <Button
                onClick={confirmAction}
                disabled={isActioning}
                className={`rounded-xl font-black px-8 text-white ${actionModal.action === 'APROBADA' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {isActioning ? 'Procesando...' : (actionModal.action === 'APROBADA' ? 'Confirmar Aprobación' : 'Confirmar Rechazo')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Detail Modal */}
      {detailModal.solicitud && (
        <Dialog open={detailModal.isOpen} onOpenChange={(open: boolean) => !open && setDetailModal({isOpen: false, solicitud: null})}>
          <DialogContent className="sm:max-w-lg rounded-[2.5rem] p-8 border-none shadow-2xl">
            <DialogHeader className="mb-6">
              <div className="size-14 rounded-2xl bg-[#116CA2]/10 flex items-center justify-center mb-4">
                <Car className="size-7 text-[#116CA2]" />
              </div>
              <DialogTitle className="text-xl font-black text-[#323232] uppercase tracking-tight">
                {detailModal.solicitud.vehiculo?.patente ?? "Sin vehículo asignado"}
              </DialogTitle>
              <DialogDescription className="font-bold text-slate-500">
                {detailModal.solicitud.solicitante?.nombre} {detailModal.solicitud.solicitante?.apellido}
                {detailModal.solicitud.solicitante?.rut ? ` · ${detailModal.solicitud.solicitante.rut}` : ""}
                {detailModal.solicitud.solicitante?.cargo ? ` · ${detailModal.solicitud.solicitante.cargo}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Motivo</p>
                  <p className="font-black text-[#323232]">{detailModal.solicitud.motivo}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                  <p className="font-black text-[#116CA2]">{detailModal.solicitud.estado_solicitud}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Salida</p>
                  <p className="font-bold text-[#323232] text-xs">{new Date(detailModal.solicitud.fecha_inicio).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Retorno Aprox.</p>
                  <p className="font-bold text-[#323232] text-xs">{new Date(detailModal.solicitud.fecha_fin).toLocaleString()}</p>
                </div>
              </div>

              {(detailModal.solicitud.km_salida || detailModal.solicitud.combustible_salida != null) && (
                <div className="bg-emerald-50 rounded-2xl p-4 space-y-1">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Registro de Salida</p>
                  <div className="flex gap-4 text-xs font-bold text-slate-600">
                    {detailModal.solicitud.km_salida && <span><Gauge className="size-3 inline mr-1" />{detailModal.solicitud.km_salida} km</span>}
                    {detailModal.solicitud.combustible_salida != null && <span><Fuel className="size-3 inline mr-1" />{detailModal.solicitud.combustible_salida}%</span>}
                  </div>
                  {detailModal.solicitud.foto_tablero_salida && (
                    <img src={detailModal.solicitud.foto_tablero_salida} alt="Tablero salida" className="w-full h-32 object-cover rounded-xl mt-2" />
                  )}
                </div>
              )}

              {detailModal.solicitud.km_retorno && (
                <div className="bg-blue-50 rounded-2xl p-4 space-y-1">
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Registro de Retorno</p>
                  <div className="flex gap-4 text-xs font-bold text-slate-600">
                    <span><Gauge className="size-3 inline mr-1" />{detailModal.solicitud.km_retorno} km</span>
                    {detailModal.solicitud.combustible_retorno != null && <span><Fuel className="size-3 inline mr-1" />{detailModal.solicitud.combustible_retorno}%</span>}
                    {detailModal.solicitud.limpieza && <span>Limpieza: {detailModal.solicitud.limpieza}</span>}
                  </div>
                  {detailModal.solicitud.danos_retorno_notas && (
                    <p className="text-xs text-red-600 font-bold mt-1">⚠ {detailModal.solicitud.danos_retorno_notas}</p>
                  )}
                  {detailModal.solicitud.foto_tablero_retorno && (
                    <img src={detailModal.solicitud.foto_tablero_retorno} alt="Tablero retorno" className="w-full h-32 object-cover rounded-xl mt-2" />
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button onClick={() => setDetailModal({isOpen: false, solicitud: null})} className="bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-xl font-black px-8">Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
