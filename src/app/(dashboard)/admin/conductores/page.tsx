"use client"
export const dynamic = 'force-dynamic'


import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Input } from "@/components/uib/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/uib/table"
import { Badge } from "@/components/uib/badge"
import { 
  Users, 
  Search, 
  TrendingUp, 
  Truck, 
  MapPin, 
  ChevronRight,
  Filter,
  Download,
  Calendar,
  Wallet
} from "lucide-react"

import { Usuario, ServicioAsignado } from "@/types/database"

interface ConductorDetail extends Usuario {
  serviciosTotales: number;
  serviciosCompletados: number;
  estado: string;
  gananciaAcumulada: number;
  ultimoServicio: string;
}

export default function DriversManagementPage() {
  const [conductores, setConductores] = useState<ConductorDetail[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    completadosHoy: 0,
    gananciaEstimada: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [usersRes, servicesRes, bonusRes] = await Promise.all([
        fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'usuarios', method: 'select', data: 'id, nombre, rol', match: { rol: 'chofer' } }) }),
        fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'servicios_asignados', method: 'select', data: '*' }) }),
        fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'bonos_produccion', method: 'select', data: '*' }) })
      ])
      const [usersJson, servicesJson, bonusJson] = await Promise.all([usersRes.json(), servicesRes.json(), bonusRes.json()])
      const users = usersJson.data
      const services = servicesJson.data
      const bonusMapping = bonusJson.data

      const today = new Date().toISOString().split('T')[0]
      
      // Calculate data per driver
      const conductoresData: ConductorDetail[] = (users || []).map((user: any) => {
        const userServices = (services || []).filter((s: any) => s.chofer_id === user.id)
        const completados = userServices.filter((s: any) => s.estado === 'completado').length
        const enRuta = userServices.find((s: any) => s.estado !== 'completado' && s.estado !== 'anulado')
        
        // Calculate estimated earnings (bonus)
        let totalBonus = 0
        userServices.filter((s: any) => s.estado === 'completado').forEach((s: any) => {
          // Simplified bonus logic (same as /mobile/billetera)
          let queryRegion = 'TRESOL VALDIVIA'
          const dest = (s.destino || "").toUpperCase()
          const orig = (s.origen || "").toUpperCase()
          if (dest.includes('OSORNO') || orig.includes('OSORNO')) queryRegion = 'TRESOL OSORNO'
          else if (dest.includes('MONTT') || orig.includes('MONTT')) queryRegion = 'TRESOL PUERTO MONTT'
          
          const match = (bonusMapping || []).find((b: any) => b.region === queryRegion && b.tipo_vehiculo === (s.bono_tipo_vehiculo || 'CAMION'))
          if (match) totalBonus += Number(match.valor)
        })

        return {
          ...user,
          serviciosTotales: userServices.length,
          serviciosCompletados: completados,
          estado: enRuta ? 'En Ruta' : 'Disponible',
          gananciaAcumulada: totalBonus,
          ultimoServicio: userServices[0]?.destino || '—'
        }
      })

      setConductores(conductoresData)
      
      // Stats
      setStats({
        total: users?.length || 0,
        activos: conductoresData.filter((c: ConductorDetail) => c.estado === 'En Ruta').length,
        completadosHoy: services?.filter((s: ServicioAsignado) => s.fecha === today && s.estado === 'completado').length || 0,
        gananciaEstimada: conductoresData.reduce((acc: number, c: ConductorDetail) => acc + c.gananciaAcumulada, 0)
      })

    } catch (error) {
      console.error("Error fetching drivers data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredConductores = conductores.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#323232] dark:text-white tracking-tight">Gestión de Conductores</h2>
          <p className="text-slate-500 font-medium">Reportes de desempeño, servicios y bonos de la flota.</p>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" className="rounded-2xl border-slate-200">
                <Download className="size-4 mr-2" />
                Exportar Reporte
            </Button>
            <Button className="bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-2xl font-black px-6 shadow-lg shadow-[#116CA2]/20">
                <Filter className="size-4 mr-2" />
                Filtros Avanzados
            </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-[#116CA2] to-[#0d5985] text-white">
          <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                  <div className="bg-white/20 p-3 rounded-2xl">
                      <Users className="size-6" />
                  </div>
              </div>
              <p className="text-white/60 text-xs font-black uppercase tracking-widest">Total Conductores</p>
              <h3 className="text-4xl font-black mt-1">{stats.total}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2rem] bg-white dark:bg-zinc-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Truck className="size-20" />
            </div>
          <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-2xl">
                      <TrendingUp className="size-6 text-blue-600" />
                  </div>
              </div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">En Ruta Ahora</p>
              <h3 className="text-4xl font-black mt-1 text-blue-600">{stats.activos}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2rem] bg-white dark:bg-zinc-900">
          <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-2xl">
                      <Calendar className="size-6 text-emerald-600" />
                  </div>
              </div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Viajes Hoy</p>
              <h3 className="text-4xl font-black mt-1 text-emerald-600">{stats.completadosHoy}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2rem] bg-white dark:bg-zinc-900">
          <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                  <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-2xl">
                      <Wallet className="size-6 text-amber-600" />
                  </div>
              </div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Bonos Acumulados</p>
              <h3 className="text-2xl font-black mt-2 text-amber-600">
                ${new Intl.NumberFormat('es-CL').format(stats.gananciaEstimada)}
              </h3>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 dark:border-zinc-800">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <input 
                placeholder="Buscar conductor por nombre..." 
                className="w-full pl-12 h-14 bg-slate-50 dark:bg-zinc-950 border-none rounded-2xl text-slate-600 focus-visible:ring-2 focus-visible:ring-[#116CA2] outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-slate-50 dark:border-zinc-800 hover:bg-transparent">
                        <TableHead className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Conductor</TableHead>
                        <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Estado Actual</TableHead>
                        <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Servicios (Comp/Tot)</TableHead>
                        <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Bonos Generados</TableHead>
                        <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Último Destino</TableHead>
                        <TableHead className="px-8 py-6 text-right"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="py-20 text-center font-bold text-slate-400 italic">Cargando reporte de conductores...</TableCell>
                        </TableRow>
                    ) : filteredConductores.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="py-20 text-center font-bold text-slate-400 italic">No se encontraron conductores con ese nombre</TableCell>
                        </TableRow>
                    ) : filteredConductores.map((c) => (
                        <TableRow key={c.id} className="border-b border-slate-50 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                            <TableCell className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-black text-[#116CA2]">
                                        {c.nombre?.charAt(0)}
                                    </div>
                                    <p className="font-bold text-[#323232] dark:text-white uppercase tracking-tight">{c.nombre}</p>
                                </div>
                            </TableCell>
                            <TableCell className="py-6">
                                <Badge className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
                                    c.estado === 'En Ruta' ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                )}>
                                    {c.estado}
                                </Badge>
                            </TableCell>
                            <TableCell className="py-6 font-bold text-slate-500">
                                <span className="text-[#323232] dark:text-white">{c.serviciosCompletados}</span>
                                <span className="mx-1">/</span>
                                <span>{c.serviciosTotales}</span>
                            </TableCell>
                            <TableCell className="py-6 font-black text-emerald-600 dark:text-emerald-400">
                                ${new Intl.NumberFormat('es-CL').format(c.gananciaAcumulada)}
                            </TableCell>
                            <TableCell className="py-6">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <MapPin className="size-3 text-slate-300" />
                                    {c.ultimoServicio}
                                </div>
                            </TableCell>
                            <TableCell className="px-8 py-6 text-right">
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 group-hover:text-[#116CA2] group-hover:bg-[#116CA2]/10 transition-all">
                                    <ChevronRight className="size-5" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}