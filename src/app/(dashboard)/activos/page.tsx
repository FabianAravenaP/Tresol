"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter,
  Image as ImageIcon,
  ChevronRight,
  Truck
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ActivosPage() {
  const [activos, setActivos] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingActivo, setEditingActivo] = useState<any>(null)
  const [filterType, setFilterType] = useState<string>("TODOS")
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    codigo: "",
    tipo: "CA",
    categoria: "CONTENEDOR",
    nombre_tipo: "Contenedores abiertos",
    capacidad: "",
    estado: "OPERATIVO",
    foto_url: ""
  })

  useEffect(() => {
    fetchActivos()
  }, [])

  const fetchActivos = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('activos')
        .select('*')
        .order('codigo')
      
      if (error) throw error
      setActivos(data || [])
    } catch (error) {
      console.error("Error fetching assets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingActivo(null)
    setFormData({ 
        codigo: "", 
        tipo: "CA", 
        categoria: "CONTENEDOR", 
        nombre_tipo: "Contenedores abiertos",
        capacidad: "", 
        estado: "OPERATIVO",
        foto_url: ""
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (a: any) => {
    setEditingActivo(a)
    setFormData({ 
      codigo: a.codigo, 
      tipo: a.tipo, 
      categoria: a.categoria,
      nombre_tipo: a.nombre_tipo,
      capacidad: a.capacidad || "",
      estado: a.estado || "OPERATIVO",
      foto_url: a.foto_url || ""
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.codigo.trim()) return
    
    try {
      if (editingActivo) {
        const { error } = await supabase
          .from('activos')
          .update(formData)
          .eq('id', editingActivo.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('activos')
          .insert([formData])
        if (error) throw error
      }
      
      setIsDialogOpen(false)
      fetchActivos()
    } catch (error) {
      console.error("Error saving asset:", error)
      alert("Error al guardar activo")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este activo?")) return
    
    try {
      const { error } = await supabase.from('activos').delete().eq('id', id)
      if (error) throw error
      fetchActivos()
    } catch (error) {
      console.error("Error deleting asset:", error)
    }
  }

  const filteredActivos = activos.filter(a => {
    const matchesSearch = a.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.nombre_tipo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "TODOS" || a.tipo === filterType;
    return matchesSearch && matchesFilter;
  })

  // Group activos by type for filtering
  const types = ["TODOS", ...Array.from(new Set(activos.map(a => a.tipo)))]

  return (
    <div className="space-y-8 p-8 md:p-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#323232] dark:text-white tracking-tight">Gestión de Activos</h2>
          <p className="text-slate-500 font-medium">Administra y monitorea todos los activos de la empresa, enfocándote en la gestión de contenedores.</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-2xl font-black px-6 shadow-lg shadow-[#116CA2]/20">
           <Plus className="size-4 mr-2" />
           Nuevo Activo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="md:col-span-3 border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50 dark:border-zinc-800 flex flex-row items-center justify-between gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                  <Input 
                    placeholder="Buscar por código o descripción..." 
                    className="pl-12 h-14 bg-slate-50 border-none rounded-2xl text-slate-600 focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <Select value={filterType} onValueChange={(val) => setFilterType(val || "TODOS")}>
                  <SelectTrigger className="w-[200px] h-14 bg-slate-50 border-none rounded-2xl text-slate-600 focus-visible:ring-2 focus-visible:ring-[#116CA2]">
                    <div className="flex items-center gap-2">
                       <Filter className="size-4 text-slate-400" />
                       <SelectValue placeholder="Filtrar por tipo" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-none p-2">
                    {types.map(t => (
                        <SelectItem key={t} value={t} className="py-3 font-bold uppercase">{t}</SelectItem>
                    ))}
                  </SelectContent>
               </Select>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-50 dark:border-zinc-800 hover:bg-transparent">
                      <TableHead className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Activo / Foto</TableHead>
                      <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Especificaciones</TableHead>
                      <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Estado</TableHead>
                      <TableHead className="px-8 py-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-20 text-center font-bold text-slate-400 italic">Cargando activos...</TableCell>
                      </TableRow>
                    ) : filteredActivos.length === 0 ? (
                      <TableRow>
                         <TableCell colSpan={4} className="py-20 text-center font-bold text-slate-400 italic">No se encontraron activos</TableCell>
                      </TableRow>
                    ) : filteredActivos.map((a) => (
                      <TableRow key={a.id} className="border-b border-slate-50 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <TableCell className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div 
                                className="size-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-zinc-700 cursor-zoom-in hover:opacity-80 transition-opacity"
                                onClick={() => a.foto_url && setViewingPhoto(a.foto_url)}
                              >
                                 {a.foto_url ? (
                                     <img src={a.foto_url} alt={a.codigo} className="w-full h-full object-cover" />
                                 ) : (
                                     <ImageIcon className="size-6 text-slate-300" />
                                 )}
                              </div>
                              <div>
                                <p className="font-black text-[#323232] dark:text-white text-lg tracking-tight leading-none mb-1">{a.codigo}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{a.nombre_tipo}</p>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell className="py-6">
                           <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                 <Badge variant="outline" className="border-slate-200 text-slate-600 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                                    {a.tipo}
                                 </Badge>
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{a.capacidad || 'CAP. N/A'}</span>
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{a.categoria}</p>
                           </div>
                        </TableCell>
                        <TableCell className="py-6">
                           <Badge className={cn(
                             "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
                             a.estado === 'OPERATIVO' ? "bg-emerald-100 text-emerald-600" :
                             a.estado === 'DESCARGADO' ? "bg-red-100 text-red-600" :
                             "bg-amber-100 text-amber-600"
                           )}>
                              {a.estado || 'DESCONOCIDO'}
                           </Badge>
                        </TableCell>
                        <TableCell className="px-8 py-6 text-right space-x-2">
                           <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(a)} className="h-10 w-10 rounded-xl text-slate-400 hover:text-[#116CA2] hover:bg-[#116CA2]/10 transition-all">
                              <Edit2 className="size-4" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                              <Trash2 className="size-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>

         <Card className="border-none shadow-2xl rounded-[2.5rem] bg-[#116CA2] text-white p-8">
            <div className="bg-white/20 p-4 rounded-3xl w-fit mb-6">
                <Package className="size-10" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Resumen Activos</h3>
            <p className="text-white/60 font-medium text-sm mb-8">Estado general de los contenedores de la empresa.</p>
            
            <div className="space-y-6">
                <div className="bg-white/10 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Total</p>
                        <p className="text-2xl font-black">{activos.length}</p>
                    </div>
                    <ChevronRight className="size-5 text-white/30" />
                </div>
                <div className="bg-white/10 p-4 rounded-2xl flex items-center justify-between border-l-4 border-emerald-400">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Operativos</p>
                        <p className="text-2xl font-black">{activos.filter(a => a.estado === 'OPERATIVO').length}</p>
                    </div>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl flex items-center justify-between border-l-4 border-amber-400">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">En Mantención</p>
                        <p className="text-2xl font-black">{activos.filter(a => a.estado === 'MANTENCION').length}</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 p-6 bg-white/5 rounded-[2rem] border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Tipos Recientes</p>
                <div className="flex flex-wrap gap-2">
                    {types.filter(t => t !== "TODOS").slice(0, 5).map(t => (
                        <span key={t} className="text-[9px] font-bold px-3 py-1 bg-white/10 rounded-full">{t}</span>
                    ))}
                </div>
            </div>
         </Card>
      </div>

      {/* Asset Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900">
          <div className="bg-[#116CA2] p-8 text-white">
             <div className="bg-white/20 p-3 rounded-2xl w-fit mb-4">
                <Package className="size-8" />
             </div>
             <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingActivo ? "Editar Activo" : "Nuevo Activo"}</DialogTitle>
             <DialogDescription className="text-white/60 font-medium">Información técnica y seguimiento visual del activo.</DialogDescription>
          </div>
          
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Código</Label>
                    <Input 
                      value={formData.codigo}
                      onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2] font-black placeholder:font-medium uppercase"
                      placeholder="CA-1"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Capacidad</Label>
                    <Input 
                      value={formData.capacidad}
                      onChange={(e) => setFormData({...formData, capacidad: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                      placeholder="Ej: 20M3"
                    />
                </div>
             </div>
             
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Contenedor</Label>
                <Select value={formData.tipo} onValueChange={(val) => setFormData({...formData, tipo: val || "CA"})}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]">
                    <SelectValue placeholder="Seleccionar Tipo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-none p-2">
                    <SelectItem value="CA" className="py-3 font-bold">CA - Abierto</SelectItem>
                    <SelectItem value="CC" className="py-3 font-bold">CC - Cerrado</SelectItem>
                    <SelectItem value="CCI" className="py-3 font-bold">CCI - Iglú</SelectItem>
                    <SelectItem value="CCL" className="py-3 font-bold">CCL - Lodo</SelectItem>
                    <SelectItem value="CCR" className="py-3 font-bold">CCR - Recolector</SelectItem>
                    <SelectItem value="CMP" className="py-3 font-bold">CMP - Compactador</SelectItem>
                    <SelectItem value="CMPL" className="py-3 font-bold">CMPL - Comp. Lodo</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Estado Operativo</Label>
                <Select value={formData.estado} onValueChange={(val) => setFormData({...formData, estado: val || "OPERATIVO"})}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]">
                    <SelectValue placeholder="Seleccionar Estado" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-none p-2">
                    <SelectItem value="OPERATIVO" className="py-3 font-bold text-emerald-600">OPERATIVO</SelectItem>
                    <SelectItem value="MANTENCION" className="py-3 font-bold text-amber-600">MANTENCIÓN</SelectItem>
                    <SelectItem value="DESCARGADO" className="py-3 font-bold text-red-600">DE BAJA / DESCARGADO</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">URL Foto (Opcional)</Label>
                <Input 
                  value={formData.foto_url}
                  onChange={(e) => setFormData({...formData, foto_url: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                  placeholder="https://..."
                />
             </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
             <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold text-slate-400" onClick={() => setIsDialogOpen(false)}>
                CANCELAR
             </Button>
             <Button 
                onClick={handleSave} 
                className="flex-1 h-12 rounded-xl bg-[#116CA2] hover:bg-[#0d5985] text-white font-black shadow-lg shadow-[#116CA2]/20"
                disabled={!formData.codigo.trim()}
              >
                {editingActivo ? "ACTUALIZAR" : "CREAR"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Photo Viewer Dialog */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
          <div className="relative group">
            {viewingPhoto && (
              <img 
                src={viewingPhoto} 
                alt="Vista ampliada" 
                className="w-full h-auto max-h-[85vh] object-contain rounded-3xl shadow-2xl" 
              />
            )}
            <Button 
              variant="secondary" 
              className="absolute top-4 right-4 rounded-full size-12 p-0 bg-white/20 backdrop-blur-md hover:bg-white/40 border-none text-white shadow-lg"
              onClick={() => setViewingPhoto(null)}
            >
              ✕
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
