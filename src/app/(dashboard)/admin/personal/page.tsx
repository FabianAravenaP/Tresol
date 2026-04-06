"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { ALL_MODULES } from "@/lib/modules"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Input } from "@/components/uib/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/uib/table"
import { Badge } from "@/components/uib/badge"
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
  Truck,
  ShieldCheck,
  ShieldAlert,
  Key,
  Phone,
  Mail,
  Smartphone
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/uib/dialog"
import { Label } from "@/components/uib/label"

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
    email: "",
    fono: "",
    tipo: "trabajador"
  })

  // Access State
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false)
  const [isEditingAccess, setIsEditingAccess] = useState(false)
  const [selectedForAccess, setSelectedForAccess] = useState<any>(null)
  const [accessData, setAccessData] = useState({
    rol: "chofer",
    password: "",
    config_sidebar: [] as any[]
  })
  const [existingUsers, setExistingUsers] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchPersonal()
    fetchExistingUsers()
  }, [])

  const fetchExistingUsers = async () => {
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'usuarios',
          method: 'select',
          data: '*'
        })
      })
      if (!res.ok) throw new Error("Proxy error")
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      
      const mapped = (data || []).reduce((acc: any, curr: any) => {
        if (curr.rut) acc[curr.rut] = curr
        return acc
      }, {})
      setExistingUsers(mapped)
    } catch (error) {
      console.error("Error fetching existing users:", error)
    }
  }

  const fetchPersonal = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'maestro_personas',
          method: 'select',
          data: '*'
        })
      })
      if (!res.ok) throw new Error("Proxy error")
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      
      // Order alphabetically locally if needed or rely on data sort
      const sorted = (data || []).sort((a: any, b: any) => a.apellido?.localeCompare(b.apellido))
      setPersonals(sorted)
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
      email: "",
      fono: "",
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
      email: person.email || "",
      fono: person.fono || "",
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
        email: formData.email.trim(),
        fono: formData.fono.trim(),
        tipo: formData.tipo
      }

      if (editingPerson) {
        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'maestro_personas',
            method: 'update',
            data: dbPerson,
            match: { id: editingPerson.id }
          })
        })
        const { error } = await res.json()
        if (error) throw new Error(error)
      } else {
        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'maestro_personas',
            method: 'insert',
            data: [dbPerson]
          })
        })
        const { error } = await res.json()
        if (error) throw new Error(error)
      }
      
      setIsDialogOpen(false)
      fetchPersonal()
    } catch (error) {
      console.error("Error saving person:", error)
      alert("Error al guardar registro")
    }
  }
  const handleOpenAccess = (person: any) => {
    setSelectedForAccess(person)
    const existing = existingUsers[person.rut]
    
    if (existing) {
        setIsEditingAccess(true)
        setAccessData({
            rol: existing.rol || person.cargo || 'USUARIO',
            password: "", 
            config_sidebar: Array.isArray(existing.config_sidebar) ? existing.config_sidebar : []
        })
    } else {
        setIsEditingAccess(false)
        setAccessData({
            rol: person.cargo || 'USUARIO',
            password: person.rut ? person.rut.toString().slice(0, 5) : "",
            config_sidebar: []
        })
    }
    
    setIsAccessDialogOpen(true)
  }

  const handleGrantAccess = async () => {
    if (!selectedForAccess) return
    if (!isEditingAccess && !accessData.password) {
        alert("Debes ingresar una contraseña inicial para habilitar.")
        return
    }
    
    try {
        if (isEditingAccess) {
            const updatePayload: any = {
                rol: accessData.rol,
                config_sidebar: accessData.config_sidebar
            }
            if (accessData.password.trim() !== '') {
                updatePayload.password = accessData.password
            }
            
            const res = await fetch('/api/proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                table: 'usuarios',
                method: 'update',
                data: updatePayload,
                match: { rut: selectedForAccess.rut }
              })
            })
            const { error } = await res.json()
            if (error) throw new Error(error)
            alert("Acceso actualizado correctamente")
        } else {
            const res = await fetch('/api/proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                table: 'usuarios',
                method: 'insert',
                data: [{
                    nombre: `${selectedForAccess.nombre} ${selectedForAccess.apellido}`,
                    rut: selectedForAccess.rut,
                    dv: selectedForAccess.dv,
                    rol: accessData.rol,
                    password: accessData.password,
                    config_sidebar: accessData.config_sidebar
                }]
              })
            })
            const { error } = await res.json()
            if (error) throw new Error(error)
            alert("Acceso habilitado correctamente")
        }
        
        setIsAccessDialogOpen(false)
        fetchExistingUsers()
    } catch (error) {
        console.error("Error granting access:", error)
        alert("Error al guardar acceso o permisos.")
    }
  }

  const handleRevokeAccess = async () => {
      if (!confirm("¿Está seguro de REVOCAR el acceso a la plataforma para este usuario?")) return
      
      try {
        const res = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              table: 'usuarios',
              method: 'delete',
              match: { rut: selectedForAccess.rut }
            })
        })
        const { error } = await res.json()
        if (error) throw new Error(error)

        setIsAccessDialogOpen(false)
        fetchExistingUsers()
      } catch (e) {
          console.error("Error revoking access", e)
          alert("No se pudo revocar el acceso.")
      }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este registro? Esto podría afectar los logs históricos.")) return
    
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'maestro_personas',
          method: 'delete',
          match: { id: id }
        })
      })
      const { error } = await res.json()
      if (error) throw new Error(error)

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
          <div className="responsive-table-container border-none shadow-none">
            <Table>
               <TableHeader>
                 <TableRow className="border-b border-slate-50 dark:border-zinc-800 hover:bg-transparent">
                   <TableHead className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Trabajador</TableHead>
                   <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">RUT</TableHead>
                   <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Estado</TableHead>
                   <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Contacto</TableHead>
                   <TableHead className="py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Empresa / Cargo</TableHead>
                   <TableHead className="px-4 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Acciones</TableHead>
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
                     <TableCell className="px-4 py-4 whitespace-normal min-w-[200px]">
                        <div className="flex items-center gap-3">
                           <div className="size-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-black text-[#116CA2]">
                              {person.nombre?.charAt(0)}
                           </div>
                           <div>
                             <p className="font-bold text-[#323232] dark:text-white uppercase tracking-tight leading-none">
                               {person.nombre} {person.apellido}
                             </p>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell className="py-4 text-sm font-bold text-slate-500">
                         {person.rut ? `${person.rut}-${person.dv}` : "S/R"}
                     </TableCell>
                     <TableCell className="py-4">
                         {existingUsers[person.rut] ? (
                             <Badge className="bg-[#51872E]/10 text-[#51872E] text-[10px] font-black border-none px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
                                 <ShieldCheck className="size-3" />
                                 CON ACCESO
                             </Badge>
                         ) : (
                             <Badge className="bg-slate-100 text-slate-400 text-[10px] font-black border-none px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
                                 <ShieldAlert className="size-3" />
                                 SIN ACCESO
                             </Badge>
                         )}
                     </TableCell>
                     <TableCell className="py-4 whitespace-normal min-w-[150px]">
                        <div className="space-y-1">
                           {person.fono && (
                              <div className="flex items-center gap-2 text-xs font-bold text-[#323232]">
                                 <Phone className="size-3 text-[#116CA2] shrink-0" />
                                 <span className="truncate">{person.fono}</span>
                              </div>
                           )}
                           {person.email && (
                              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                                 <Mail className="size-3 shrink-0" />
                                 <span className="truncate">{person.email.toLowerCase()}</span>
                              </div>
                           )}
                           {!person.fono && !person.email && (
                              <span className="text-slate-300 text-[10px] italic">Sin datos</span>
                           )}
                        </div>
                     </TableCell>
                     <TableCell className="py-4 whitespace-normal min-w-[150px]">
                        <div className="space-y-1">
                           <div className="flex items-center gap-2 text-xs font-bold text-[#323232]">
                              <Building2 className="size-3 text-[#116CA2] shrink-0" />
                              <span className="truncate">{person.empresa || "—"}</span>
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                              <Briefcase className="size-3 shrink-0" />
                              <span className="truncate">{person.cargo || "—"}</span>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                        <Button 
                         variant="ghost" 
                         size="icon" 
                         onClick={() => handleOpenAccess(person)} 
                         className={cn(
                             "h-10 w-10 rounded-xl transition-all",
                             existingUsers[person.rut] 
                             ? "text-[#51872E] hover:bg-[#51872E]/10" 
                             : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                         )}
                         title={existingUsers[person.rut] ? "Acceso Activo" : "Habilitar Acceso"}
                        >
                           {existingUsers[person.rut] ? <ShieldCheck className="size-4" /> : <ShieldAlert className="size-4" />}
                        </Button>
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
          </div>
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

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Celular / Teléfono</Label>
                <div className="relative">
                   <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                   <Input 
                       value={formData.fono}
                       onChange={(e) => setFormData({...formData, fono: e.target.value})}
                       className="h-12 pl-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                       placeholder="+56 9 1234 5678"
                   />
                </div>
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Correo Electrónico</Label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                   <Input 
                       value={formData.email}
                       onChange={(e) => setFormData({...formData, email: e.target.value})}
                       className="h-12 pl-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                       placeholder="ejemplo@tresol.cl"
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
                className="flex-1 h-12 rounded-xl bg-[#116CA2] hover:bg-[#0d5985] text-white font-black shadow-lg shadow-[#116CA2]/20"
                disabled={!formData.nombre.trim() || !formData.apellido.trim()}
             >
                {editingPerson ? "ACTUALIZAR" : "GUARDAR"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Dialog */}
      <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900">
          <div className="bg-[#51872E] p-8 text-white">
             <div className="bg-white/20 p-3 rounded-2xl w-fit mb-4">
                <ShieldCheck className="size-8" />
             </div>
             <DialogTitle className="text-2xl font-black uppercase tracking-tight">{isEditingAccess ? "Editar Configuración de Acceso" : "Habilitar Acceso"}</DialogTitle>
             <DialogDescription className="text-white/60 font-medium">Configura las credenciales y permisos para {selectedForAccess?.nombre}.</DialogDescription>
          </div>
          
          <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cargo / Rol en Plataforma</Label>
                <div className="relative">
                   <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                   <Input 
                      value={accessData.rol}
                      onChange={(e) => setAccessData({...accessData, rol: e.target.value})}
                      className="h-12 pl-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#51872E] font-bold"
                      placeholder="Ej: GERENTE DE PROCESOS"
                   />
                </div>
                <p className="text-[9px] text-slate-400 font-medium px-1 italic">
                    Este valor determina el título visible del usuario en la plataforma.
                </p>
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    {isEditingAccess ? "Actualizar Contraseña (Opcional)" : "Contraseña Inicial (Default 5 dígitos RUT)"}
                </Label>
                <div className="relative">
                   <Key className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                   <Input 
                    value={accessData.password}
                    onChange={(e) => setAccessData({...accessData, password: e.target.value})}
                    className="h-12 pl-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#51872E]"
                    placeholder={isEditingAccess ? "Dejar en blanco para mantener actual" : "Escribe la contraseña"}
                  />
                </div>
                {!isEditingAccess && (
                    <p className="text-[9px] text-slate-400 font-medium px-1 italic">
                        Para este trabajador ({selectedForAccess?.rut}), se sugiere usar "{selectedForAccess?.rut?.toString().slice(0, 5)}".
                    </p>
                )}
             </div>

             <div className="space-y-4 pt-4 border-t border-slate-100">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Módulos de Acceso Rápido (Sidebar)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ALL_MODULES.map(module => {
                        const isSelected = accessData.config_sidebar.some(m => m.id === module.id);
                        return (
                            <div key={module.id} 
                                onClick={() => {
                                    if(isSelected) {
                                        setAccessData(prev => ({...prev, config_sidebar: prev.config_sidebar.filter(m => m.id !== module.id)}))
                                    } else {
                                        setAccessData(prev => ({...prev, config_sidebar: [...prev.config_sidebar, module]}))
                                    }
                                }}
                                className={cn(
                                    "p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all",
                                    isSelected 
                                    ? "bg-[#51872E]/10 border-[#51872E]/30 text-[#323232]" 
                                    : "bg-white border-slate-100 text-slate-500 hover:border-[#116CA2]/30"
                                )}>
                                <div className={cn(
                                    "size-5 rounded flex items-center justify-center transition-colors",
                                    isSelected ? "bg-[#51872E] text-white" : "border-2 border-slate-300"
                                )}>
                                    {isSelected && <Check className="size-3" />}
                                </div>
                                <span className="text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis">{module.name}</span>
                            </div>
                        )
                    })}
                </div>
             </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
             {isEditingAccess && (
                 <Button variant="ghost" className="h-12 rounded-xl font-black text-red-500 hover:bg-red-50 hover:text-red-600 transition-all px-6" onClick={handleRevokeAccess}>
                    REVOCAR ACCESO
                 </Button>
             )}
             <div className="flex-1"></div>
             <Button variant="ghost" className="w-24 h-12 rounded-xl font-bold text-slate-400" onClick={() => setIsAccessDialogOpen(false)}>
                CERRAR
             </Button>
             <Button 
                onClick={handleGrantAccess} 
                className="px-6 h-12 rounded-xl bg-[#51872E] hover:bg-[#406B24] text-white font-black shadow-lg shadow-[#51872E]/20"
                disabled={!isEditingAccess && !accessData.password}
             >
                {isEditingAccess ? "GUARDAR" : "HABILITAR ACCESO"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}