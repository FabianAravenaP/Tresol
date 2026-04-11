"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Badge } from "@/components/uib/badge"
import { Input } from "@/components/uib/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/uib/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/uib/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/uib/select"
import { 
  Utensils, 
  ChefHat, 
  ClipboardList, 
  Package, 
  Plus, 
  TrendingUp, 
  Users, 
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Save,
  Clock,
  ArrowRight
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function CocinaAdmin() {
  const [activeTab, setActiveTab] = useState("produccion")
  const [recetas, setRecetas] = useState<any[]>([])
  const [minutas, setMinutas] = useState<any[]>([])
  const [elecciones, setElecciones] = useState<any[]>([])
  const [inventario, setInventario] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Modal States
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false)

  // Form States
  const [newRecipe, setNewRecipe] = useState({ nombre: "", descripcion: "" })
  const [newMenu, setNewMenu] = useState({ fecha: format(new Date(), "yyyy-MM-dd"), receta_id: "", descripcion: "" })
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null)
  const [newStock, setNewStock] = useState("")

  const today = format(new Date(), "yyyy-MM-dd")

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      const endpoints = [
        { table: 'cocina_recetas', method: 'select', data: '*, cocina_ingredientes(*)' },
        { table: 'cocina_minutas', method: 'select', data: '*, receta:cocina_recetas(*)', order: { column: 'fecha', ascending: false } },
        { table: 'cocina_elecciones', method: 'select', data: '*, usuario:usuarios(*), minuta:cocina_minutas(*)' },
        { table: 'cocina_inventario', method: 'select', data: '*' }
      ]

      const results = await Promise.all(
        endpoints.map(e => fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(e)
        }).then(res => res.json()))
      )

      setRecetas(results[0].data || [])
      setMinutas(results[1].data || [])
      setElecciones(results[2].data || [])
      setInventario(results[3].data || [])

    } catch (error) {
      console.error("Error fetching admin kitchen data:", error)
      toast.error("Error al cargar datos del panel de cocina")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveRecipe = async () => {
    if (!newRecipe.nombre) return toast.error("El nombre es obligatorio")
    setIsActionLoading(true)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'cocina_recetas',
          method: 'insert',
          data: { ...newRecipe }
        })
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      
      toast.success("Receta guardada exitosamente")
      setIsRecipeModalOpen(false)
      setNewRecipe({ nombre: "", descripcion: "" })
      fetchInitialData()
    } catch (error) {
      toast.error("No se pudo guardar la receta")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSaveMenu = async () => {
    if (!newMenu.receta_id || !newMenu.fecha) return toast.error("Debe completar todos los campos")
    setIsActionLoading(true)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'cocina_minutas',
          method: 'insert',
          data: { ...newMenu }
        })
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)

      toast.success("Minuta programada correctamente")
      setIsMenuModalOpen(false)
      fetchInitialData()
    } catch (error) {
      toast.error("Error al programar la minuta")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUpdateStock = async () => {
    if (!selectedInventoryItem || newStock === "") return
    setIsActionLoading(true)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'cocina_inventario',
          method: 'update',
          match: { id: selectedInventoryItem.id },
          data: { stock: parseFloat(newStock) }
        })
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)

      toast.success("Stock actualizado")
      setIsInventoryModalOpen(false)
      fetchInitialData()
    } catch (error) {
      toast.error("Error al actualizar existencias")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm("¿Seguro que desea eliminar esta receta? Puede fallar si está usada en minutas actuales.")) return
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'cocina_recetas',
          method: 'delete',
          match: { id }
        })
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      toast.success("Receta eliminada")
      fetchInitialData()
    } catch (error) {
      toast.error("Error al eliminar la receta")
    }
  }

  // Stats Calculations
  const minutasHoy = minutas.filter(m => m.fecha === today)
  const countsHoy = minutasHoy.map(m => {
    const total = elecciones.filter(e => e.minuta_id === m.id && e.confirmo_asistencia).length
    return { nombre: m.receta?.nombre, id: m.id, total, ingredientes: m.receta?.cocina_ingredientes || [] }
  })

  const totalIngredientesNecesarios = countsHoy.length > 0 ? (
    countsHoy.reduce((acc: any, curr: any) => {
        curr.ingredientes.forEach((ing: any) => {
            if (!acc[ing.nombre]) {
                acc[ing.nombre] = { unidad: ing.unidad, total: 0 }
            }
            // Parse common values like "10 KG" or "5 UN"
            // For now, since we initialized with 0 for manual tracking in Excel, 
            // we'll just list them. If we had quantities per person, we'd multiply.
            acc[ing.nombre].total += 1 // Placeholder for presence
        })
        return acc
    }, {})
  ) : {}

  const totalComensalesHoy = elecciones.filter(e => 
    minutasHoy.some(m => m.id === e.minuta_id) && (e.confirmo_asistencia || e.no_asistira)
  ).length

  const assistConfirmedHoy = elecciones.filter(e => 
    minutasHoy.some(m => m.id === e.minuta_id) && e.confirmo_asistencia
  ).length

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#323232] flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-[#51872E]/10 rounded-xl">
                <ChefHat className="size-8 text-[#51872E]" />
            </div>
            Gestión de Cocina
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Control de minutas, producción e inventario alimenticio.</p>
        </div>
        <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl font-bold border-slate-200" onClick={fetchInitialData}>
                Actualizar Datos
            </Button>
            <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-[#51872E] hover:bg-[#406B24] text-white rounded-xl font-bold gap-2">
                        <Plus className="size-4" />
                        Nueva Receta
                    </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Crear Nueva Receta</DialogTitle>
                        <DialogDescription className="font-medium text-slate-400">Guarda los mejores platos en tu base de datos centralizada.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombre del Plato</label>
                            <Input 
                                placeholder="Ej: Pollo con Arroz Primavera" 
                                className="h-14 bg-slate-50 border-none rounded-2xl font-bold"
                                value={newRecipe.nombre}
                                onChange={(e) => setNewRecipe({...newRecipe, nombre: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Descripción / Ingredientes Clave</label>
                            <Input 
                                placeholder="Opcional..." 
                                className="h-14 bg-slate-50 border-none rounded-2xl font-bold"
                                value={newRecipe.descripcion}
                                onChange={(e) => setNewRecipe({...newRecipe, descripcion: e.target.value})}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button className="w-full bg-[#323232] hover:bg-black text-white h-14 rounded-2xl font-black uppercase tracking-widest gap-2" onClick={handleSaveRecipe} disabled={isActionLoading}>
                                <Save className="size-4" />
                                {isActionLoading ? "Guardando..." : "Guardar Receta"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard 
          title="Pedidos Hoy" 
          value={assistConfirmedHoy.toString()} 
          icon={<Utensils className="size-6 text-[#51872E]" />} 
          color="bg-[#51872E]"
        />
        <StatsCard 
          title="Confirmaciones" 
          value={totalComensalesHoy.toString()} 
          subValue={totalComensalesHoy > 0 ? `${((assistConfirmedHoy/totalComensalesHoy)*100).toFixed(0)}% asiste` : 'Sin datos'}
          icon={<Users className="size-6 text-[#116CA2]" />} 
          color="bg-[#116CA2]"
        />
        <StatsCard 
          title="Opciones Hoy" 
          value={minutasHoy.length.toString()} 
          icon={<Calendar className="size-6 text-[#FBC15F]" />} 
          color="bg-[#FBC15F]"
        />
        <StatsCard 
          title="Items Críticos" 
          value={inventario.filter(i => i.stock < 10).length.toString()} 
          icon={<AlertCircle className="size-6 text-red-500" />} 
          color="bg-red-500"
        />
      </div>

      <Tabs defaultValue="produccion" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex h-auto mb-8">
          <TabsTrigger value="produccion" className="flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-[#116CA2] data-[state=active]:text-white">
            Producción Hoy
          </TabsTrigger>
          <TabsTrigger value="minutas" className="flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-[#51872E] data-[state=active]:text-white">
            Programas / Minutas
          </TabsTrigger>
          <TabsTrigger value="recetas" className="flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            Catálogo Recetas
          </TabsTrigger>
          <TabsTrigger value="inventario" className="flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
            Bodega / Insumos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produccion" className="animate-in slide-in-from-bottom-4 duration-500">
           <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-black/5">
              <CardHeader className="p-8 border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight">Carga de Cocina para Hoy</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-[#116CA2] mt-1">{format(new Date(), "EEEE dd 'de' MMMM", { locale: es })}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-[#51872E]/10 text-[#51872E] border-[#51872E]/20 p-2 px-4 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase">
                        Corte 10:00 AM Active
                    </Badge>
                  </div>
              </CardHeader>
              <CardContent className="p-8">
                  {countsHoy.length === 0 ? (
                      <div className="py-20 text-center space-y-4">
                          <Clock className="size-16 text-slate-100 mx-auto" />
                          <p className="text-slate-400 font-bold italic tracking-tight">No hay minutas asignadas para hoy.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Resumen Platos Totales</h4>
                              {countsHoy.map((c, i) => (
                                  <div key={i} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-[#116CA2]/5 transition-all">
                                      <div className="flex items-center gap-4">
                                          <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#116CA2] font-black group-hover:bg-[#116CA2] group-hover:text-white transition-all">
                                              {i + 1}
                                          </div>
                                          <span className="font-black text-[#323232] uppercase tracking-tight">{c.nombre}</span>
                                      </div>
                                      <div className="text-3xl font-black text-[#323232]">
                                          {c.total}
                                      </div>
                                  </div>
                              ))}
                          </div>
                          <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Insumos Críticos para hoy</h4>
                              <div className="bg-[#323232] rounded-[2rem] p-8 text-white space-y-4">
                                  {Object.keys(totalIngredientesNecesarios).length === 0 ? (
                                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center py-4">Sin requerimientos de ingredientes.</p>
                                  ) : (
                                      <div className="grid grid-cols-1 gap-3">
                                          {Object.keys(totalIngredientesNecesarios).slice(0, 10).map((name, i) => (
                                              <div key={i} className="flex justify-between items-center border-b border-white/10 pb-2 last:border-0 last:pb-0">
                                                  <span className="text-[10px] font-black uppercase tracking-tight">{name}</span>
                                                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[9px] font-bold">REQUERIDO</Badge>
                                              </div>
                                          ))}
                                          {Object.keys(totalIngredientesNecesarios).length > 10 && (
                                              <p className="text-[9px] text-slate-500 text-center font-bold italic pt-2">... y {Object.keys(totalIngredientesNecesarios).length - 10} ingredientes más</p>
                                          )}
                                      </div>
                                  )}
                              </div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1 mt-6">Movimientos Recientes</h4>
                              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                                  {elecciones.filter(e => minutasHoy.some(m => m.id === e.minuta_id)).slice(0, 10).map((e, i) => (
                                      <div key={i} className="flex items-center justify-between p-3 px-5 bg-white border border-slate-100 rounded-2xl">
                                          <div className="flex items-center gap-3">
                                              <div className="size-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-[#116CA2]">
                                                  {e.usuario?.nombre?.charAt(0)}
                                              </div>
                                              <div>
                                                  <p className="text-xs font-black text-[#323232] uppercase leading-none">{e.usuario?.nombre}</p>
                                                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{e.minuta?.receta?.nombre}</p>
                                              </div>
                                          </div>
                                          <Badge className={e.confirmo_asistencia ? 'bg-emerald-500' : 'bg-red-400'}>
                                              {e.confirmo_asistencia ? 'CONFIRMADO' : 'NO ASISTIRÁ'}
                                          </Badge>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  )}
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="minutas" className="animate-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-black/5">
                <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight">Programación Semanal</CardTitle>
                        <CardDescription className="text-xs font-bold text-slate-400 uppercase">Define el menú para los próximos días.</CardDescription>
                    </div>
                    <Dialog open={isMenuModalOpen} onOpenChange={setIsMenuModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-xl font-black gap-2 h-12 shadow-lg shadow-[#116CA2]/20 transition-all">
                                <Calendar className="size-4" />
                                Programar Pauta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[2.5rem] p-10 bg-white">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Vincular Plato a Fecha</DialogTitle>
                                <DialogDescription className="font-medium text-slate-400">Los trabajadores podrán ver esto en su App Móvil para confirmar.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 pt-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fecha del Servicio</label>
                                    <Input 
                                        type="date" 
                                        className="h-14 bg-slate-50 border-none rounded-2xl font-bold"
                                        value={newMenu.fecha}
                                        onChange={(e) => setNewMenu({...newMenu, fecha: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Seleccionar Receta</label>
                                    <Select 
                                        value={newMenu.receta_id} 
                                        onValueChange={(v: string) => setNewMenu({...newMenu, receta_id: v})}
                                    >
                                        <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold">
                                            <SelectValue placeholder="Elige un plato del catálogo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {recetas.map(r => (
                                                <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="w-full h-14 bg-[#116CA2] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#116CA2]/20" onClick={handleSaveMenu} disabled={isActionLoading}>
                                    {isActionLoading ? "Procesando..." : "Habilitar en Calendario"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Plato Asignado</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Gestión</th>
                                </tr>
                            </thead>
                            <tbody>
                                {minutas.map((m, i) => (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6">
                                            <span className="font-black text-[#323232] truncate">
                                                {format(new Date(m.fecha + "T12:00:00"), "EEEE dd MMM", { locale: es }).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <Badge className="bg-[#116CA2]/10 text-[#116CA2] hover:bg-[#116CA2]/20 font-black px-4 py-2 rounded-xl border-none">
                                                {m.receta?.nombre}
                                            </Badge>
                                        </td>
                                        <td className="p-6">
                                            {m.fecha === today ? (
                                                <Badge className="bg-emerald-500 text-white font-bold">HOY</Badge>
                                            ) : m.fecha > today ? (
                                                <Badge className="bg-blue-400 text-white font-bold">PROGRAMADO</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-300 font-bold">HISTÓRICO</Badge>
                                            )}
                                        </td>
                                        <td className="p-6 text-center">
                                            <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 pointer-events-none opacity-50"><Trash2 className="size-4" /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="recetas">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recetas.map((r, i) => (
                    <Card key={i} className="border-none shadow-lg rounded-[2.5rem] group hover:shadow-2xl transition-all overflow-hidden bg-white">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex justify-between items-start">
                                <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                    <Utensils className="size-6" />
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-100 group-hover:text-red-400 transition-colors" onClick={() => handleDeleteRecipe(r.id)}>
                                    <Trash2 className="size-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-4">
                            <h4 className="text-2xl font-black text-[#323232] uppercase tracking-tighter leading-none">{r.nombre}</h4>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {(r.cocina_ingredientes || []).slice(0, 3).map((ing: any, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-[8px] font-bold uppercase border-slate-100 text-slate-400">
                                        {ing.nombre}
                                    </Badge>
                                ))}
                                {r.cocina_ingredientes?.length > 3 && (
                                    <Badge variant="outline" className="text-[8px] font-bold uppercase border-slate-100 text-slate-400">
                                        +{r.cocina_ingredientes.length - 3}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-slate-400 font-medium line-clamp-2">
                                {r.descripcion || "Sin detalles adicionales registrados."}
                            </p>
                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <Badge className="bg-slate-50 text-slate-400 border-none font-bold">ID: {r.id.slice(0,8)}</Badge>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" className="text-[10px] font-black text-amber-600 group-hover:bg-amber-50 rounded-xl uppercase tracking-widest transition-all">Ver Más</Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-3xl">
                                        <DialogHeader>
                                            <DialogTitle className="uppercase font-black">{r.nombre}</DialogTitle>
                                            <DialogDescription className="font-bold text-xs uppercase tracking-widest text-[#51872E]">Ingredientes y Preparación</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-4">
                                            <div className="grid grid-cols-1 gap-2">
                                                {r.cocina_ingredientes?.map((ing: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                                        <span className="text-xs font-black uppercase text-[#323232]">{ing.nombre}</span>
                                                        <span className="text-[10px] font-bold text-[#51872E] uppercase">{ing.unidad}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabsContent>

        <TabsContent value="inventario">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {inventario.map((item, i) => (
                    <Card key={i} className="border-none shadow-xl rounded-[2.5rem] group hover:shadow-2xl transition-all bg-white relative overflow-hidden">
                        <CardContent className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-[#323232] group-hover:text-white transition-all shadow-sm">
                                    <Package className="size-7" />
                                </div>
                                <Badge className={item.stock < 10 ? "bg-red-500 shadow-lg shadow-red-200" : "bg-[#51872E] shadow-lg shadow-[#51872E]/20"}>
                                    {item.stock < 10 ? 'BAJO STOCK' : 'ABASTECIDO'}
                                </Badge>
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-[#323232] uppercase tracking-tight">{item.nombre}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{item.unidad}</p>
                            </div>
                            <div className="flex items-end justify-between pt-2">
                                <div className="text-4xl font-black text-[#323232] tracking-tighter">
                                    {item.stock} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{item.unidad}</span>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="size-12 rounded-2xl border-slate-100 hover:bg-[#323232] hover:text-white shadow-sm transition-all"
                                    onClick={() => {
                                        setSelectedInventoryItem(item)
                                        setNewStock(item.stock.toString())
                                        setIsInventoryModalOpen(true)
                                    }}
                                >
                                    <TrendingUp className="size-5" />
                                </Button>
                            </div>
                        </CardContent>
                        {item.stock < 10 && <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse" />}
                    </Card>
                ))}
             </div>

             <Dialog open={isInventoryModalOpen} onOpenChange={setIsInventoryModalOpen}>
                <DialogContent className="rounded-[2.5rem] p-10 bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Actualizar Stock</DialogTitle>
                        <DialogDescription className="font-medium text-slate-400">Ajuste manual de existencias para {selectedInventoryItem?.nombre}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nueva Cantidad ({selectedInventoryItem?.unidad})</label>
                            <Input 
                                type="number" 
                                className="h-16 bg-slate-50 border-none rounded-2xl font-black text-3xl text-center"
                                value={newStock}
                                onChange={(e) => setNewStock(e.target.value)}
                            />
                        </div>
                        <Button className="w-full h-14 bg-[#323232] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-black/20" onClick={handleUpdateStock} disabled={isActionLoading}>
                            {isActionLoading ? "Actualizando..." : "Confirmar Ajuste"}
                        </Button>
                    </div>
                </DialogContent>
             </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatsCard({ title, value, subValue, icon, color }: { title: string, value: string, subValue?: string, icon: any, color: string }) {
    return (
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-black/5 relative group hover:scale-[1.02] transition-all">
            <CardContent className="p-8 flex items-center gap-6">
                <div className={`p-5 rounded-2xl ${color} text-white shadow-xl shadow-current/20`}>
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <h4 className="text-3xl font-black text-[#323232] tracking-tighter">{value}</h4>
                        {subValue && <span className="text-[9px] font-black text-[#51872E] uppercase tracking-tighter">{subValue}</span>}
                    </div>
                </div>
                <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`} />
            </CardContent>
        </Card>
    )
}
