"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/uib/card"
import { Input } from "@/components/uib/input"
import { Label } from "@/components/uib/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/uib/select"
import { Badge } from "@/components/uib/badge"
import { Button } from "@/components/uib/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/uib/table"
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Truck, 
  User, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle,
  FileText,
  Navigation2,
  ChevronRight,
  Download
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function ServiciosHistorialPage() {
  const [servicios, setServicios] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filter states
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [driverFilter, setDriverFilter] = useState("all")
  const [vehicleFilter, setVehicleFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  useEffect(() => {
    fetchData()
    
    const channel = supabase
      .channel('public:servicios_historial')
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
      const [servsRes, usrsRes, vehsRes] = await Promise.all([
        fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'servicios_asignados',
            method: 'select',
            data: '*, usuarios:chofer_id (id, nombre), vehiculos:vehiculo_id (id, patente, tipo)'
          })
        }),
        fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'usuarios', method: 'select', data: 'id, nombre', match: { rol: 'chofer' } })
        }),
        fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'vehiculos', method: 'select', data: 'id, patente, tipo' })
        })
      ])
      const [servs, usrs, vehs] = await Promise.all([servsRes.json(), usrsRes.json(), vehsRes.json()])

      // Sort services client-side (proxy doesn't support order)
      const sortedServs = (servs.data || []).sort((a: any, b: any) => {
        const dateCmp = (b.fecha || '').localeCompare(a.fecha || '')
        return dateCmp !== 0 ? dateCmp : (b.created_at || '').localeCompare(a.created_at || '')
      })

      // Enhance services with distance (rpc not supported via proxy)
      if (sortedServs.length > 0) {
        const enhanced = await Promise.all(sortedServs.map(async (s: any) => {
          try {
            const { data: dist } = await supabase.rpc('get_service_distance', { p_servicio_id: s.id })
            return { ...s, kilometraje: dist || 0 }
          } catch { return { ...s, kilometraje: 0 } }
        }))
        setServicios(enhanced)
      }

      setUsuarios(usrs.data || [])
      setVehiculos(vehs.data || [])
    } catch (err) {
      console.error("Error fetching history data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredServicios = servicios.filter(s => {
    const matchesSearch = 
      s.origen?.toLowerCase().includes(search.toLowerCase()) ||
      s.destino?.toLowerCase().includes(search.toLowerCase()) ||
      s.usuarios?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      s.vehiculos?.patente?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || s.estado === statusFilter
    const matchesDriver = driverFilter === "all" || s.chofer_id === driverFilter
    const matchesVehicle = vehicleFilter === "all" || s.vehiculo_id === vehicleFilter
    
    const matchesFrom = !dateFrom || s.fecha >= dateFrom
    const matchesTo = !dateTo || s.fecha <= dateTo

    return matchesSearch && matchesStatus && matchesDriver && matchesVehicle && matchesFrom && matchesTo
  })

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px] font-black">Pendiente</Badge>
      case 'en_ruta_origen':
      case 'en_ruta_destino': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px] font-black">En Ruta</Badge>
      case 'en_origen': 
      case 'en_destino': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 uppercase text-[10px] font-black">En Operación</Badge>
      case 'completado': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px] font-black">Completado</Badge>
      case 'anulado': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 uppercase text-[10px] font-black">Anulado</Badge>
      default: return <Badge variant="outline" className="uppercase text-[10px] font-black">{estado}</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#116CA2] mb-1">
            <Clock className="size-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Histórico Operativo</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[#323232]">Registro de Servicios</h2>
          <p className="text-muted-foreground font-medium text-lg">Monitoreo y auditoría de todas las rutas realizadas.</p>
        </div>
        
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-xl font-bold gap-2" onClick={fetchData}>
              Actualizar
           </Button>
           <Button className="bg-[#116CA2] hover:bg-[#0d5681] text-white rounded-xl font-bold gap-2">
              <Download className="size-4" />
              Exportar
           </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="rounded-[2rem] border-none shadow-xl bg-white/80 backdrop-blur-md overflow-hidden">
        <CardContent className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Búsqueda Rápida</Label>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input 
                      placeholder="Chofer, Patente, Ruta..." 
                      className="pl-10 h-11 rounded-xl border-slate-200 bg-white shadow-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Estado</Label>
                 <Select value={statusFilter} onValueChange={(v: string) => setStatusFilter(v || "all")}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-sm font-bold">
                       <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                       <SelectItem value="all">Todos los estados</SelectItem>
                       <SelectItem value="pendiente">Pendiente</SelectItem>
                       <SelectItem value="en_ruta_origen">En Ruta</SelectItem>
                       <SelectItem value="completado">Completado</SelectItem>
                       <SelectItem value="anulado">Anulado</SelectItem>
                    </SelectContent>
                 </Select>
              </div>

              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Conductor</Label>
                 <Select value={driverFilter} onValueChange={(v: string) => setDriverFilter(v || "all")}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-sm font-bold">
                       <SelectValue placeholder="Todos los choferes" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                       <SelectItem value="all">Todos los choferes</SelectItem>
                       {usuarios.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Desde</Label>
                   <Input 
                      type="date" 
                      className="h-11 rounded-xl border-slate-200 bg-white shadow-sm text-xs font-bold"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Hasta</Label>
                   <Input 
                      type="date" 
                      className="h-11 rounded-xl border-slate-200 bg-white shadow-sm text-xs font-bold"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                   />
                </div>
              </div>
           </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="rounded-[2rem] border-none shadow-2xl bg-white overflow-hidden">
        <CardContent className="p-0">
           <Table>
              <TableHeader className="bg-slate-50 border-b">
                 <TableRow className="hover:bg-transparent">
                    <TableHead className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicio</TableHead>
                    <TableHead className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ruta (Origen → Destino)</TableHead>
                    <TableHead className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Conductor & Vehículo</TableHead>
                    <TableHead className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Distancia</TableHead>
                    <TableHead className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estatus</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                       <TableRow key={i}>
                          <TableCell colSpan={5} className="py-8"><div className="h-8 bg-slate-100 animate-pulse rounded-lg mx-8" /></TableCell>
                       </TableRow>
                    ))
                 ) : filteredServicios.length === 0 ? (
                    <TableRow>
                       <TableCell colSpan={5} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-30">
                             <FileText className="size-12" />
                             <p className="font-bold">No se encontraron registros para estos filtros.</p>
                          </div>
                       </TableCell>
                    </TableRow>
                 ) : (
                    filteredServicios.map((s) => (
                       <TableRow key={s.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                          <TableCell className="py-6 px-8 font-bold">
                             <div className="flex flex-col">
                                <span className="text-slate-900 tracking-tight">{new Date(s.fecha).toLocaleDateString()}</span>
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">#{s.id.slice(0, 8)}</span>
                             </div>
                          </TableCell>
                          <TableCell className="py-6 px-8">
                             <div className="flex items-center gap-3">
                                <div className="space-y-0.5 min-w-[120px]">
                                   <p className="text-[9px] font-black text-[#116CA2] uppercase leading-none">Origen</p>
                                   <p className="text-sm font-bold text-slate-700 truncate">{s.origen}</p>
                                </div>
                                <ChevronRight className="size-4 text-slate-300" />
                                <div className="space-y-0.5 min-w-[120px]">
                                   <p className="text-[9px] font-black text-emerald-600 uppercase leading-none">Destino</p>
                                   <p className="text-sm font-bold text-slate-700 truncate">{s.destino}</p>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell className="py-6 px-8">
                             <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                   <span className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                                      <User className="size-3.5 text-slate-400" />
                                      {(s.usuarios as any)?.nombre}
                                   </span>
                                   <span className="flex items-center gap-1.5 font-black text-[10px] text-[#116CA2] uppercase tracking-wider">
                                      <Truck className="size-3" />
                                      {(s.vehiculos as any)?.patente} ({(s.vehiculos as any)?.tipo})
                                   </span>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell className="py-6 px-8 text-center">
                             <div className="flex flex-col items-center">
                                <span className="text-base font-black text-slate-900 leading-none">{s.kilometraje?.toFixed(1) || '0.0'}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KM</span>
                             </div>
                          </TableCell>
                          <TableCell className="py-6 px-8 text-right">
                             {getStatusBadge(s.estado)}
                          </TableCell>
                       </TableRow>
                    ))
                 )}
              </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  )
}