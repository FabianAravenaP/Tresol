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
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  Check,
  MoreVertical,
  Briefcase,
  Building2,
  Fingerprint,
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

export default function PersonalManagementPage() {
  const [personals, setPersonals] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<any>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    rut: "",
    dv: "",
    cargo: "",
    empresa: "",
    patente_default: "",
    tipo: "trabajador"
  })

  useEffect(() => {
    fetchPersonal()
  }, [])

  const fetchPersonal = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('maestro_personas')
        .select('*')
        .order('apellido', { ascending: true })
      
      if (error) throw error
      setPersonals(data || [])
    } catch (error) {
      console.error("Error fetching personal:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingPerson(null)
    setFormData({ 
      nombre: "", 
      apellido: "", 
      rut: "", 
      dv: "", 
      cargo: "", 
      empresa: "", 
      patente_default: "",
      tipo: "trabajador"
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (person: any) => {
    setEditingPerson(person)
    setFormData({ 
      nombre: person.nombre || "", 
      apellido: person.apellido || "", 
      rut: person.rut || "", 
      dv: person.dv || "", 
      cargo: person.cargo || "", 
      empresa: person.empresa || "", 
      patente_default: person.patente_default || "",
      tipo: person.tipo || "trabajador"
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim() || !formData.apellido.trim()) return
    
    try {
      const dbPerson = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        rut: formData.rut.trim(),
        dv: formData.dv.trim().toUpperCase(),
        cargo: formData.cargo.trim(),
        empresa: formData.empresa.trim(),
        patente_default: formData.patente_default.trim().toUpperCase(),
        tipo: formData.tipo
      }

      if (editingPerson) {
        const { error } = await supabase
          .from('maestro_personas')
          .update(dbPerson)
          .eq('id', editingPerson.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('maestro_personas')
          .insert([dbPerson])
        if (error) throw error
      }
      
      setIsDialogOpen(false)
      fetchPersonal()
    } catch (error) {
      console.error("Error saving person:", error)
      alert("Error al guardar registro")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este registro? Esto podría afectar los logs históricos.")) return
    
    try {
      // Note: We might want to handle foreign key constraints if logs reference this
      const { error } = await supabase.from('maestro_personas').delete().eq('id', id)
      if (error) throw error
      fetchPersonal()
    } catch (error) {
      console.error("Error deleting person:", error)
      alert("No se puede eliminar. Probablemente tenga registros de ingreso asociados.")
    }
  }

  const filteredPersonal = personals.filter(p => 
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.rut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#323232] dark:text-white tracking-tight">Gestión de Personal</h2>
          <p className="text-slate-500 font-medium">Administra el maestro de trabajadores para el control de portería.</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-2xl font-black px-6 shadow-lg shadow-[#116CA2]/20">
           <UserPlus className="size-4 mr-2" />
           Agregar Trabajador
        </Button>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 dark:border-zinc-800">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input 
                placeholder="Buscar por nombre, RUT o empresa..." 
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
                  <TableHead className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Trabajador</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">RUT</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Empresa / Cargo</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Patente</TableHead>
                  <TableHead className="px-8 py-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center font-bold text-slate-400 italic">Cargando maestro de personal...</TableCell>
                  </TableRow>
                ) : filteredPersonal.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={5} className="py-20 text-center font-bold text-slate-400 italic">No se encontraron registros</TableCell>
                  </TableRow>
                ) : filteredPersonal.map((person) => (
                  <TableRow key={person.id} className="border-b border-slate-50 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <TableCell className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-black text-[#116CA2]">
                             {person.nombre?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-[#323232] dark:text-white uppercase tracking-tight leading-none mb-1">
                              {person.nombre} {person.apellido}
                            </p>
                            <span className="text-[9px] font-black text-[#51872E] uppercase tracking-widest">{person.tipo || 'TRABAJADOR'}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-6 text-sm font-bold text-slate-500">
                        {person.rut ? `${person.rut}-${person.dv}` : "S/R"}
                    </TableCell>
                    <TableCell className="py-6">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#323232]">
                             <Building2 className="size-3 text-[#116CA2]" />
                             {person.empresa || "—"}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                             <Briefcase className="size-3" />
                             {person.cargo || "—"}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-6">
                        {person.patente_default ? (
                           <Badge className="bg-slate-100 text-slate-600 font-mono font-black border-none px-3 py-1 rounded-lg">
                              {person.patente_default}
                           </Badge>
                        ) : (
                           <span className="text-slate-300 text-xs">—</span>
                        )}
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right space-x-2">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(person)} className="h-10 w-10 rounded-xl text-slate-400 hover:text-[#116CA2] hover:bg-[#116CA2]/10 transition-all">
                          <Edit2 className="size-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDelete(person.id)} className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                          <Trash2 className="size-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
           </Table>
        </CardContent>
      </Card>

      {/* Person Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900">
          <div className="bg-[#116CA2] p-8 text-white">
             <div className="bg-white/20 p-3 rounded-2xl w-fit mb-4">
                <UserPlus className="size-8" />
             </div>
             <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingPerson ? "Editar Trabajador" : "Nuevo Trabajador"}</DialogTitle>
             <DialogDescription className="text-white/60 font-medium">Ingresa los datos del maestro para el control de accesos.</DialogDescription>
          </div>
          
          <div className="p-8 grid grid-cols-2 gap-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombres</Label>
                <Input 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                  placeholder="Ej: Juan"
                />
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Apellidos</Label>
                <Input 
                  value={formData.apellido}
                  onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                  placeholder="Ej: Pérez Soto"
                />
             </div>
             
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">RUT (Sin puntos)</Label>
                <div className="flex gap-2">
                   <Input 
                    value={formData.rut}
                    onChange={(e) => setFormData({...formData, rut: e.target.value})}
                    className="h-12 flex-1 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                    placeholder="12345678"
                  />
                  <div className="w-16 flex items-center justify-center bg-slate-100 rounded-xl font-bold font-mono">
                    <span className="text-slate-400 mr-1">-</span>
                    <Input 
                        value={formData.dv}
                        maxLength={1}
                        onChange={(e) => setFormData({...formData, dv: e.target.value})}
                        className="w-10 h-8 p-0 text-center bg-transparent border-none shadow-none focus-visible:ring-0 uppercase"
                        placeholder="K"
                    />
                  </div>
                </div>
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Patente Default</Label>
                <div className="relative">
                   <Truck className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                   <Input 
                    value={formData.patente_default}
                    onChange={(e) => setFormData({...formData, patente_default: e.target.value})}
                    className="h-12 pl-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2] uppercase"
                    placeholder="ABCD12"
                  />
                </div>
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Empresa</Label>
                <Input 
                  value={formData.empresa}
                  onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                  placeholder="Ej: Tresol"
                />
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cargo</Label>
                <Input 
                  value={formData.cargo}
                  onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                  placeholder="Ej: Chofer"
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
                disabled={!formData.nombre.trim() || !formData.apellido.trim()}
             >
                {editingPerson ? "ACTUALIZAR" : "GUARDAR"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
