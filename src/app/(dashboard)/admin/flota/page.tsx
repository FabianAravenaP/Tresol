"use client"
export const dynamic = 'force-dynamic'


import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Input } from "@/components/uib/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/uib/table"
import { Badge } from "@/components/uib/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/uib/tabs"
import { 
  Truck, 
  Plus, 
  Search, 
  Edit2, 
  Trash2
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/uib/dialog"
import { Label } from "@/components/uib/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/uib/select"
import { Vehiculo } from "@/types/database"

export default function FlotaMasterPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null)
  
  const [formData, setFormData] = useState({
    patente: "",
    marca: "",
    modelo: "",
    tipo: "recolector",
    categoria: "CAMION",
    estado: "OPERATIVO",
    id_interno: ""
  })
  const [activeTab, setActiveTab] = useState("CAMION")

  useEffect(() => {
    fetchVehiculos()
  }, [])

  const fetchVehiculos = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'vehiculos',
          method: 'select',
          data: '*'
        })
      })
      if (!res.ok) throw new Error("Proxy error")
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      
      const sorted = (data || []).sort((a: any, b: any) => a.patente?.localeCompare(b.patente))
      setVehiculos(sorted)
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingVehiculo(null)
    setFormData({ patente: "", marca: "", modelo: "", tipo: "recolector", categoria: activeTab, estado: "OPERATIVO", id_interno: "" })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (v: any) => {
    setEditingVehiculo(v)
    setFormData({ 
      patente: v.patente, 
      marca: v.marca || "",
      modelo: v.modelo || "",
      tipo: v.tipo, 
      categoria: v.categoria || "CAMION",
      estado: v.estado || "OPERATIVO",
      id_interno: v.id_interno || ""
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.patente.trim()) return
    
    try {
      const cleanPatente = formData.patente.replace(/[\s-]/g, '').toUpperCase()
      const dbVehiculo = {
        patente: cleanPatente,
        marca: formData.marca.trim().toUpperCase(),
        modelo: formData.modelo.trim().toUpperCase(),
        tipo: formData.tipo,
        categoria: formData.categoria,
        estado: formData.estado,
        id_interno: formData.id_interno.trim()
      }

      if (editingVehiculo) {
        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'vehiculos',
            method: 'update',
            data: dbVehiculo,
            match: { id: editingVehiculo.id }
          })
        })
        const { error } = await res.json()
        if (error) throw new Error(error)
      } else {
        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'vehiculos',
            method: 'insert',
            data: [dbVehiculo]
          })
        })
        const { error } = await res.json()
        if (error) throw new Error(error)
      }
      
      setIsDialogOpen(false)
      fetchVehiculos()
    } catch (error) {
      console.error("Error saving vehicle:", error)
      alert("Error al guardar vehículo")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este vehículo?")) return
    
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'vehiculos',
          method: 'delete',
          match: { id: id }
        })
      })
      const { error } = await res.json()
      if (error) throw new Error(error)
      
      fetchVehiculos()
    } catch (error) {
      console.error("Error deleting vehicle:", error)
      alert("Error al eliminar vehículo.")
    }
  }

  const filteredVehiculos = vehiculos.filter(v => {
    const matchesSearch = v.patente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = v.categoria === activeTab
    return matchesSearch && matchesTab
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#323232] dark:text-white tracking-tight">Gestión de Flota</h2>
          <p className="text-slate-500 font-medium">Administra y configura los activos de transporte de la empresa.</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-2xl font-black px-6 shadow-lg shadow-[#116CA2]/20">
           <Plus className="size-4 mr-2" />
           Nuevo Vehículo
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <TabsList className="bg-transparent h-fit p-0 gap-2 mb-2">
            <TabsTrigger 
                value="CAMION" 
                className={cn(
                    "h-12 px-8 rounded-2xl font-black transition-all",
                    activeTab === "CAMION" 
                    ? "bg-[#116CA2] text-white shadow-lg shadow-[#116CA2]/20" 
                    : "bg-white text-slate-400 hover:text-[#116CA2] border-none shadow-md"
                )}
            >
                CAMIONES
            </TabsTrigger>
            <TabsTrigger 
                value="MENOR" 
                className={cn(
                    "h-12 px-8 rounded-2xl font-black transition-all",
                    activeTab === "MENOR" 
                    ? "bg-[#116CA2] text-white shadow-lg shadow-[#116CA2]/20" 
                    : "bg-white text-slate-400 hover:text-[#116CA2] border-none shadow-md"
                )}
            >
                VEHÍCULOS MENORES
            </TabsTrigger>
            <TabsTrigger 
                value="INACTIVO" 
                className={cn(
                    "h-12 px-8 rounded-2xl font-black transition-all",
                    activeTab === "INACTIVO" 
                    ? "bg-[#116CA2] text-white shadow-lg shadow-[#116CA2]/20" 
                    : "bg-white text-slate-400 hover:text-[#116CA2] border-none shadow-md"
                )}
            >
                INACTIVOS ({vehiculos.filter(v => v.categoria === 'INACTIVO').length})
            </TabsTrigger>
         </TabsList>
           <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden mt-4">
        <CardHeader className="p-8 border-b border-slate-50 dark:border-zinc-800">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input 
                placeholder="Buscar por patente o tipo..." 
                className="pl-12 h-14 bg-slate-50 border-none rounded-2xl text-slate-600 focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="responsive-table-container border-none shadow-none">
            <Table>
               <TableHeader>
                 <TableRow className="border-b border-slate-50 dark:border-zinc-800 hover:bg-transparent">
                   <TableHead className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Vehículo</TableHead>
                   <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Configuración</TableHead>
                   <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Estado Actual</TableHead>
                   <TableHead className="px-8 py-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Acciones</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {isLoading ? (
                   <TableRow>
                     <TableCell colSpan={4} className="py-20 text-center font-bold text-slate-400 italic">Cargando flota...</TableCell>
                   </TableRow>
                 ) : filteredVehiculos.length === 0 ? (
                   <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center font-bold text-slate-400 italic">No hay vehículos registrados</TableCell>
                   </TableRow>
                 ) : filteredVehiculos.map((v) => (
                   <TableRow key={v.id} className="border-b border-slate-50 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                     <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="size-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex flex-col items-center justify-center font-black text-[#116CA2]">
                              <Truck className="size-5 mb-0.5" />
                              <span className="text-[8px] tracking-widest uppercase">ID</span>
                           </div>
                           <div>
                             <p className="font-black text-[#323232] dark:text-white text-lg tracking-tight leading-none mb-1">{v.patente}</p>
                              <div className="flex items-center gap-2">
                                 <p className="text-[10px] font-black text-[#116CA2] uppercase tracking-widest">ID INVENTARIO: {v.id_interno || 'N/A'}</p>
                                {(v.marca || v.modelo) && (
                                   <>
                                      <span className="text-slate-200">|</span>
                                      <p className="text-[10px] font-black text-[#116CA2] uppercase tracking-widest">{v.marca} {v.modelo}</p>
                                   </>
                                )}
                             </div>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell className="py-6">
                        <Badge variant="outline" className="border-slate-200 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                           {v.tipo}
                        </Badge>
                     </TableCell>
                     <TableCell className="py-6">
                         <Badge className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
                            v.estado === 'OPERATIVO' ? "bg-emerald-100 text-emerald-600" :
                            v.estado === 'FALLA MECÁNICA' ? "bg-red-100 text-red-600" :
                            "bg-amber-100 text-amber-600"
                         )}>
                            {v.estado || 'DESCONOCIDO'}
                         </Badge>
                     </TableCell>
                     <TableCell className="px-8 py-6 text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(v)} className="h-10 w-10 rounded-xl text-slate-400 hover:text-[#116CA2] hover:bg-[#116CA2]/10 transition-all">
                           <Edit2 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                           <Trash2 className="size-4" />
                        </Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Tabs>

      {/* Fleet Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900">
          <div className="bg-[#116CA2] p-8 text-white">
             <div className="bg-white/20 p-3 rounded-2xl w-fit mb-4">
                <Truck className="size-8" />
             </div>
             <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingVehiculo ? "Editar Vehículo" : "Nuevo Vehículo"}</DialogTitle>
             <DialogDescription className="text-white/60 font-medium">Datos técnicos y operacionales del activo.</DialogDescription>
          </div>
          
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Patente</Label>
                    <Input 
                      value={formData.patente}
                      onChange={(e) => setFormData({...formData, patente: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2] font-black placeholder:font-medium uppercase"
                      placeholder="ABCD-12"
                    />
                </div>
                 <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">N° Inventario / Control Interno</Label>
                    <Input 
                      value={formData.id_interno}
                      onChange={(e) => setFormData({...formData, id_interno: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2] font-black"
                      placeholder="Ej: 449"
                    />
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Marca</Label>
                    <Input 
                        value={formData.marca}
                        onChange={(e) => setFormData({...formData, marca: e.target.value})}
                        className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2] uppercase"
                        placeholder="PEUGEOT"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Modelo</Label>
                    <Input 
                        value={formData.modelo}
                        onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                        className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2] uppercase"
                        placeholder="PARTNER"
                    />
                 </div>
              </div>

             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoría</Label>
                    <Select value={formData.categoria} onValueChange={(val: string) => setFormData({...formData, categoria: val || "CAMION"})}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]">
                            <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl border-none p-2">
                            <SelectItem value="CAMION" className="py-3 font-bold">CAMIONES</SelectItem>
                            <SelectItem value="MENOR" className="py-3 font-bold">V. MENORES</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo Detalle</Label>
                    <Select value={formData.tipo} onValueChange={(val: string) => setFormData({...formData, tipo: val || "recolector"})}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]">
                        <SelectValue placeholder="Seleccionar Tipo" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-none p-2">
                        {formData.categoria === 'CAMION' ? (
                            <>
                                <SelectItem value="recolector" className="py-3 font-bold uppercase text-[10px]">RECOLECTOR</SelectItem>
                                <SelectItem value="ampliroll" className="py-3 font-bold uppercase text-[10px]">AMPLIROLL</SelectItem>
                                <SelectItem value="tracto" className="py-3 font-bold uppercase text-[10px]">TRACTO</SelectItem>
                                <SelectItem value="atmosférico" className="py-3 font-bold uppercase text-[10px]">ATMOSFÉRICO</SelectItem>
                                <SelectItem value="grúa" className="py-3 font-bold uppercase text-[10px]">GRÚA</SelectItem>
                                <SelectItem value="otro_pesado" className="py-3 font-bold uppercase text-[10px]">OTRO PESADO</SelectItem>
                            </>
                        ) : (
                            <>
                                <SelectItem value="camioneta" className="py-3 font-bold uppercase text-[10px]">CAMIONETA</SelectItem>
                                <SelectItem value="furgón" className="py-3 font-bold uppercase text-[10px]">FURGÓN</SelectItem>
                                <SelectItem value="camion 3/4" className="py-3 font-bold uppercase text-[10px]">CAMIÓN 3/4</SelectItem>
                                <SelectItem value="auto" className="py-3 font-bold uppercase text-[10px]">AUTOMÓVIL</SelectItem>
                            </>
                        )}
                    </SelectContent>
                    </Select>
                 </div>
              </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Estado Operativo</Label>
                <Select value={formData.estado} onValueChange={(val: string) => setFormData({...formData, estado: val || "OPERATIVO"})}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]">
                    <SelectValue placeholder="Seleccionar Estado" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-none p-2">
                    <SelectItem value="OPERATIVO" className="py-3 font-bold text-emerald-600">OPERATIVO</SelectItem>
                    <SelectItem value="FALLA MECÁNICA" className="py-3 font-bold text-red-600">FALLA MECÁNICA</SelectItem>
                    <SelectItem value="MANTENCIÓN" className="py-3 font-bold text-amber-600">MANTENCIÓN PREVENTIVA</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
             <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold text-slate-400" onClick={() => setIsDialogOpen(false)}>
                CANCELAR
             </Button>
             <Button 
                onClick={handleSave} 
                className="flex-1 h-12 rounded-xl bg-[#116CA2] hover:bg-[#0d5985] text-white font-black shadow-lg shadow-[#116CA2]/20"
                disabled={!formData.patente.trim()}
             >
                {editingVehiculo ? "ACTUALIZAR" : "CREAR"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}