"use client"
export const dynamic = 'force-dynamic'


import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Input } from "@/components/uib/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/uib/table"
import { Badge } from "@/components/uib/badge"
import { 
  MapPin, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ArrowRight,
  Building2,
  X
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/uib/dialog"
import { Label } from "@/components/uib/label"
import { Cliente } from "@/types/database"

export default function ClientesMasterPage() {
  const [rutas, setRutas] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRuta, setEditingRuta] = useState<Cliente | null>(null)
  
  // Form State for Associations
  const [formData, setFormData] = useState({
    cliente: "",
    disposicion_final: ""
  })

  // Edit Name State
  const [isEditNameDialogOpen, setIsEditNameDialogOpen] = useState(false)
  const [editNameData, setEditNameData] = useState({ oldName: "", newName: "" })

  useEffect(() => {
    fetchRutas()
  }, [])

  const fetchRutas = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre')
      
      if (error) throw error
      setRutas(data || [])
    } catch (error) {
      console.error("Error fetching clients/destinations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingRuta(null)
    setFormData({ cliente: "", disposicion_final: "" })
    setIsDialogOpen(true)
  }

  const handleAddDestinationToClient = (nombre: string) => {
    setEditingRuta(null)
    setFormData({ cliente: nombre, disposicion_final: "" })
    setIsDialogOpen(true)
  }

  const handleOpenEditName = (nombre: string) => {
    setEditNameData({ oldName: nombre, newName: nombre })
    setIsEditNameDialogOpen(true)
  }

  const handleSaveEditName = async () => {
    if (!editNameData.newName.trim()) return
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ nombre: editNameData.newName })
        .eq('nombre', editNameData.oldName)
      if (error) throw error
      setIsEditNameDialogOpen(false)
      fetchRutas()
    } catch (error) {
      console.error("Error updating client name:", error)
      alert("Error al actualizar el nombre del cliente")
    }
  }

  const handleSave = async () => {
    if (!formData.cliente.trim() || !formData.disposicion_final.trim()) return
    
    try {
      if (editingRuta) {
        const { error } = await supabase
          .from('clientes')
          .update({
            nombre: formData.cliente,
            disposicion_final: formData.disposicion_final
          })
          .eq('id', editingRuta.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([{
            nombre: formData.cliente,
            disposicion_final: formData.disposicion_final
          }])
        if (error) throw error
      }
      
      setIsDialogOpen(false)
      fetchRutas()
    } catch (error) {
      console.error("Error saving client/destination:", error)
      alert("Error al guardar cliente/destino")
    }
  }

  const handleDelete = async (id: string, destinoName: string) => {
    if (!confirm(`¿Está seguro de eliminar el destino ${destinoName}?`)) return
    
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) throw error
      fetchRutas()
    } catch (error) {
      console.error("Error deleting client/destination:", error)
    }
  }

  const handleDeleteClient = async (nombre: string) => {
    if (!confirm(`¿Está seguro de eliminar TODOS los destinos para el cliente ${nombre}?`)) return
    
    try {
      const { error } = await supabase.from('clientes').delete().eq('nombre', nombre)
      if (error) throw error
      fetchRutas()
    } catch (error) {
      console.error("Error deleting client:", error)
    }
  }

  const filteredRutas = rutas.filter(r => 
    r.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.disposicion_final?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedRutas = filteredRutas.reduce((acc: Record<string, { nombre: string; destinos: { id: string; nombre: string }[] }>, curr: Cliente) => {
    const key = curr.nombre || "Sin Nombre"
    if (!acc[key]) {
      acc[key] = {
        nombre: key,
        destinos: []
      }
    }
    if (curr.disposicion_final) {
       acc[key].destinos.push({
         id: curr.id,
         nombre: curr.disposicion_final
       })
    }
    return acc
  }, {})

  const groupedArray = Object.values(groupedRutas).sort((a, b) => a.nombre.localeCompare(b.nombre))

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#323232] dark:text-white tracking-tight">Clientes y Destinos</h2>
          <p className="text-slate-500 font-medium">Administra los puntos de retiro y sus destinos compatibles.</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-2xl font-black px-6 shadow-lg shadow-[#116CA2]/20">
           <Plus className="size-4 mr-2" />
           Nueva Asociación
        </Button>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 dark:border-zinc-800">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input 
                placeholder="Buscar por cliente o lugar de disposición..." 
                className="pl-12 h-14 bg-slate-50 border-none rounded-2xl text-slate-600 focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-50 dark:border-zinc-800 hover:bg-transparent">
                  <TableHead className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Punto de Retiro (Cliente)</TableHead>
                  <TableHead className="py-6 text-center text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Logística</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Destino Final</TableHead>
                  <TableHead className="px-8 py-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-20 text-center font-bold text-slate-400 italic">Cargando clientes...</TableCell>
                  </TableRow>
                ) : groupedArray.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={4} className="py-20 text-center font-bold text-slate-400 italic">No hay clientes configurados</TableCell>
                  </TableRow>
                ) : groupedArray.map((group) => (
                  <TableRow key={group.nombre} className="border-b border-slate-50 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <TableCell className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="size-10 rounded-xl bg-[#51872E]/10 flex items-center justify-center text-[#51872E]">
                             <Building2 className="size-5" />
                          </div>
                          <span className="font-black text-[#323232] dark:text-white uppercase tracking-tight">{group.nombre}</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                       <ArrowRight className="size-4 text-slate-300 mx-auto" />
                    </TableCell>
                    <TableCell className="py-6">
                       <div className="flex flex-wrap gap-2">
                          {group.destinos.length === 0 ? (
                             <span className="text-xs font-bold text-slate-400 italic">Sin destinos</span>
                          ) : (
                             group.destinos.map((d: { id: string; nombre: string }) => (
                               <Badge key={d.id} variant="secondary" className="px-3 py-1.5 bg-[#116CA2]/10 text-[#116CA2] hover:bg-[#116CA2]/20 font-bold uppercase tracking-tight flex items-center gap-2">
                                  {d.nombre}
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(d.id, d.nombre) }} 
                                    className="hover:bg-white/50 rounded-full p-0.5 transition-colors"
                                    title="Eliminar destino"
                                  >
                                     <X className="size-3" />
                                  </button>
                               </Badge>
                             ))
                          )}
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right space-x-2 whitespace-nowrap">
                       <Button variant="ghost" size="sm" onClick={() => handleAddDestinationToClient(group.nombre)} className="text-[#51872E] hover:text-[#406B24] hover:bg-[#51872E]/10 font-bold text-xs uppercase tracking-widest px-3">
                          <Plus className="size-3 mr-1" /> Destino
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleOpenEditName(group.nombre)} className="h-9 w-9 rounded-xl text-slate-400 hover:text-[#116CA2] hover:bg-[#116CA2]/10 transition-all" title="Editar Nombre Cliente">
                          <Edit2 className="size-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(group.nombre)} className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Eliminar Cliente Completo">
                          <Trash2 className="size-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
           </Table>
        </CardContent>
      </Card>

      {/* Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900">
          <div className="bg-[#51872E] p-8 text-white">
             <div className="bg-white/20 p-3 rounded-2xl w-fit mb-4">
                <MapPin className="size-8" />
             </div>
             <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingRuta ? "Editar Asociación" : "NuevaAsociación"}</DialogTitle>
             <DialogDescription className="text-white/60 font-medium">Vincula un punto de generación con su destino autorizado.</DialogDescription>
          </div>
          
          <div className="p-8 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cliente / Punto de Retiro</Label>
                <Input 
                  value={formData.cliente}
                  onChange={(e) => setFormData({...formData, cliente: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#51872E] uppercase font-bold"
                  placeholder="Nombre de la empresa o planta"
                />
             </div>
             
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lugar de Disposición Final</Label>
                <div className="relative">
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                   <Input 
                    value={formData.disposicion_final}
                    onChange={(e) => setFormData({...formData, disposicion_final: e.target.value})}
                    className="h-12 pl-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2] uppercase font-bold"
                    placeholder="Ej: Relleno Sanitario A"
                  />
                </div>
             </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
             <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold text-slate-400" onClick={() => setIsDialogOpen(false)}>
                CANCELAR
             </Button>
             <Button 
                onClick={handleSave} 
                className="flex-1 h-12 rounded-xl bg-[#51872E] hover:bg-[#406B24] text-white font-black shadow-lg shadow-[#51872E]/20"
                disabled={!formData.cliente.trim() || !formData.disposicion_final.trim()}
             >
                CREAR ASOCIACIÓN
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Name Dialog */}
      <Dialog open={isEditNameDialogOpen} onOpenChange={setIsEditNameDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900">
          <div className="bg-[#116CA2] p-8 text-white">
             <div className="bg-white/20 p-3 rounded-2xl w-fit mb-4">
                <Edit2 className="size-8" />
             </div>
             <DialogTitle className="text-2xl font-black uppercase tracking-tight">Editar Nombre</DialogTitle>
             <DialogDescription className="text-white/60 font-medium">Actualiza el nombre del cliente para todos sus destinos.</DialogDescription>
          </div>
          
          <div className="p-8 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nuevo Nombre</Label>
                <Input 
                  value={editNameData.newName}
                  onChange={(e) => setEditNameData({...editNameData, newName: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2] uppercase font-bold"
                  placeholder="Nombre de la empresa o planta"
                />
             </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
             <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold text-slate-400" onClick={() => setIsEditNameDialogOpen(false)}>
                CANCELAR
             </Button>
             <Button 
                onClick={handleSaveEditName} 
                className="flex-1 h-12 rounded-xl bg-[#116CA2] hover:bg-[#0d5985] text-white font-black shadow-lg shadow-[#116CA2]/20"
                disabled={!editNameData.newName.trim()}
             >
                ACTUALIZAR
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}