"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  Legend
} from "recharts"
import { 
  TrendingUp, 
  Truck, 
  Scale, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  Calendar,
  Filter,
  RefreshCcw,
  ArrowUp,
  ArrowDown
} from "lucide-react"

import * as XLSX from "xlsx"

export default function AnaliticasPage() {
  const [data, setData] = useState<any>({
    comprobantes: [],
    servicios: [],
    vehiculos: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const [{ data: comp }, { data: serv }, { data: veh }] = await Promise.all([
        supabase.from('comprobantes').select('*'),
        supabase.from('servicios_asignados').select('*'),
        supabase.from('vehiculos').select('*')
      ])
      
      setData({
        comprobantes: comp || [],
        servicios: serv || [],
        vehiculos: veh || []
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportConsolidatedReport = () => {
    try {
      // 1. Prepare data for Export
      const exportData = data.comprobantes.map((c: any) => {
        // Find associated service
        const service = data.servicios.find((s: any) => s.id === c.servicio_id)
        
        return {
          "Fecha Servicio": service?.fecha || c.fecha,
          "Origen": service?.origen || "-",
          "Destino": service?.destino || "-",
          "Tipo Servicio": service?.tipo_servicio || "-",
          "Estado Viaje": service?.estado || "-",
          "Empresa Generadora": c.empresa,
          "Lugar/Planta": c.planta_lugar,
          "Patente": c.patente,
          "Folio": c.folio_numero,
          "Kilos Asimilables": Number(c.cat_asimilables_kilos) || 0,
          "Kilos Industriales": Number(c.cat_industriales_kilos) || 0,
          "Kilos Peligrosos": Number(c.cat_peligrosos_kilos) || 0,
          "Kilos Lodos": Number(c.cat_lodos_kilos) || 0,
          "Kilos Escombros": Number(c.cat_escombros_kilos) || 0,
          "Kilos Valorizables": Number(c.cat_valorizables_kilos) || 0,
          "Observaciones": c.observaciones || ""
        }
      })

      // 2. Create Workbook and Worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Consolidado")

      // 3. Download file
      XLSX.writeFile(workbook, `Tresol_Reporte_Operaciones_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      alert("Hubo un problema al generar el reporte.")
    }
  }

  // Memoized KPIs
  const kpis = useMemo(() => {
    const totalKilos = data.comprobantes.reduce((sum: number, c: any) => {
      return sum + (Number(c.cat_asimilables_kilos) || 0) + 
                 (Number(c.cat_lodos_kilos) || 0) + 
                 (Number(c.cat_escombros_kilos) || 0) + 
                 (Number(c.cat_peligrosos_kilos) || 0) + 
                 (Number(c.cat_industriales_kilos) || 0) + 
                 (Number(c.cat_valorizables_kilos) || 0)
    }, 0)

    const fleetUtilization = data.vehiculos.length > 0 
      ? Math.round((data.servicios.filter((s: any) => s.estado !== 'pendiente').length / data.vehiculos.length) * 100)
      : 0

    const completionRate = data.servicios.length > 0
      ? Math.round((data.servicios.filter((s: any) => s.estado === 'completado').length / data.servicios.length) * 100)
      : 0

    const criticalVehicles = data.vehiculos.filter((v: any) => v.estado === 'FALLA MECÁNICA').length

    return { totalKilos, fleetUtilization, completionRate, criticalVehicles }
  }, [data])

  // Chart Data preparation
  const categoryData = useMemo(() => {
    const categories = [
      { name: 'Asimilables', value: 0, color: '#116CA2' },
      { name: 'Lodos', value: 0, color: '#10B981' },
      { name: 'Escombros', value: 0, color: '#F59E0B' },
      { name: 'Peligrosos', value: 0, color: '#EF4444' },
      { name: 'Industriales', value: 0, color: '#8B5CF6' },
      { name: 'Valorizables', value: 0, color: '#EC4899' }
    ]

    data.comprobantes.forEach((c: any) => {
      categories[0].value += Number(c.cat_asimilables_kilos) || 0
      categories[1].value += Number(c.cat_lodos_kilos) || 0
      categories[2].value += Number(c.cat_escombros_kilos) || 0
      categories[3].value += Number(c.cat_peligrosos_kilos) || 0
      categories[4].value += Number(c.cat_industriales_kilos) || 0
      categories[5].value += Number(c.cat_valorizables_kilos) || 0
    })

    return categories.filter(c => c.value > 0)
  }, [data])

  const weeklyTrend = useMemo(() => {
    // Basic trend mock-up using real dates from DB
    const days: any = {}
    data.comprobantes.forEach((c: any) => {
      const date = new Date(c.created_at).toLocaleDateString()
      days[date] = (days[date] || 0) + 1
    })
    return Object.entries(days).map(([name, value]) => ({ name, value })).slice(-7)
  }, [data])

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#323232] dark:text-white tracking-tight">Control Total & Analíticas</h2>
          <p className="text-slate-500 font-medium">Inteligencia operativa y trazabilidad en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
           <Filter className="size-4 text-slate-400" />
           <select 
             className="bg-transparent border-none text-sm font-bold text-slate-600 focus:ring-0 outline-none"
             value={timeRange}
             onChange={(e) => setTimeRange(e.target.value)}
           >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="ytd">Este año</option>
           </select>
           <div className="h-4 w-[1px] bg-slate-200 mx-2" />
           <Button variant="ghost" size="icon" onClick={fetchAllData} className="h-8 w-8 text-[#116CA2]">
              <RefreshCcw className={cn("size-4", isLoading && "animate-spin")} />
           </Button>
        </div>
      </div>

      {/* KPI Ribbons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Carga Total" 
          value={`${(kpis.totalKilos / 1000).toFixed(1)} Ton`} 
          icon={Scale} 
          trend="+12%" 
          up={true} 
          color="blue"
        />
        <KPICard 
          title="Utilización" 
          value={`${kpis.fleetUtilization}%`} 
          icon={Truck} 
          trend="-2%" 
          up={false} 
          color="emerald"
        />
        <KPICard 
          title="Completitud" 
          value={`${kpis.completionRate}%`} 
          icon={CheckCircle2} 
          trend="+5%" 
          up={true} 
          color="amber"
        />
        <KPICard 
          title="Fallas Críticas" 
          value={kpis.criticalVehicles} 
          icon={AlertTriangle} 
          trend="0" 
          up={true}
          color="red"
          isAlert={kpis.criticalVehicles > 0}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Volume Trend */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden min-h-[450px]">
          <CardHeader className="p-8 pb-0">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Volumen de Operación</p>
                   <CardTitle className="text-xl font-black uppercase tracking-tight">Tendencia de Servicios</CardTitle>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                   <TrendingUp className="size-5" />
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#116CA2" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#116CA2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#116CA2" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden min-h-[450px]">
          <CardHeader className="p-8 pb-0">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Composición de Carga</p>
                   <CardTitle className="text-xl font-black uppercase tracking-tight">Distribución por Tipo</CardTitle>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                   <Scale className="size-5" />
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
             <div className="flex flex-col md:flex-row h-full items-center">
                <ResponsiveContainer width="100%" height="80%">
                   <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={10}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip />
                   </PieChart>
                </ResponsiveContainer>
                <div className="w-full md:w-48 space-y-3 shrink-0">
                   {categoryData.map((c, i) => (
                     <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                           <span className="text-xs font-bold text-slate-500">{c.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-700">{Math.round((c.value / kpis.totalKilos) * 100)}%</span>
                     </div>
                   ))}
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Section */}
      <Card className="border-none shadow-2xl rounded-[3rem] bg-[#116CA2] text-white overflow-hidden p-10">
         <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
               <div className="bg-white/20 p-3 rounded-2xl w-fit mx-auto md:mx-0">
                  <Calendar className="size-8" />
               </div>
               <h3 className="text-3xl font-black uppercase tracking-tight">Informes Consolidados</h3>
               <p className="text-white/70 font-medium max-w-md">
                 Genera un reporte detallado de todas las operaciones, incluyendo servicios, pesajes y trazabilidad de conductores.
               </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
               <Button onClick={exportConsolidatedReport} className="h-16 px-8 rounded-2xl bg-white text-[#116CA2] hover:bg-white/90 font-black text-sm uppercase tracking-widest shadow-xl">
                  <Download className="size-5 mr-3" />
                  Exportar Excel
               </Button>
               <Button variant="outline" className="h-16 px-8 rounded-2xl border-white/20 text-white hover:bg-white/10 font-black text-sm uppercase tracking-widest">
                  Personalizar Filtros
               </Button>
            </div>
         </div>
      </Card>
    </div>
  )
}

function KPICard({ title, value, icon: Icon, trend, up, color, isAlert }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  }

  return (
    <Card className={cn(
      "border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-300 hover:scale-[1.03]",
      isAlert && "border-2 border-red-500/20 shadow-red-500/10"
    )}>
      <CardContent className="p-8 space-y-4">
        <div className="flex justify-between items-start">
           <div className={cn("p-4 rounded-2xl", colors[color])}>
              <Icon className="size-6" />
           </div>
           <div className={cn(
             "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase",
             up ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
           )}>
              {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
              {trend}
           </div>
        </div>
        <div>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{title}</p>
           <h3 className="text-3xl font-black text-[#323232] dark:text-white tracking-tighter">{value}</h3>
        </div>
      </CardContent>
    </Card>
  )
}
