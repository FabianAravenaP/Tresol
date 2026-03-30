"use client"

import { useState, useEffect } from "react"
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
  Key, 
  Shield, 
  X,
  Check,
  UserCheck,
  Eye,
  EyeOff
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

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    nombre: "",
    rol: "chofer",
    password: ""
  })

  useEffect(() => {
    const session = localStorage.getItem('tresol_session')
    if (session) {
      const user = JSON.parse(session)
      if (user.rol !== 'master_admin') {
        alert("Acceso denegado. Solo el Administrador Maestro puede gestionar usuarios.")
        window.location.href = '/admin'
        return
      }
    }
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'usuarios',
          method: 'select'
        })
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      setUsuarios(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormData({ nombre: "", rol: "chofer", password: "" })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (user: any) => {
    setEditingUser(user)
    setFormData({ 
      nombre: user.nombre, 
      rol: user.rol, 
      password: user.password || "" 
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim()) return
    
    try {
      const dbUser = {
        nombre: formData.nombre,
        rol: formData.rol,
        password: formData.password
      }

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'usuarios',
          method: editingUser ? 'update' : 'insert',
          data: dbUser,
          match: editingUser ? { id: editingUser.id } : undefined
        })
      })

      const { error } = await res.json()
      if (error) throw new Error(error)
      
      setIsDialogOpen(false)
      fetchUsuarios()
    } catch (error) {
      console.error("Error saving user:", error)
      alert("Error al guardar usuario")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este usuario?")) return
    
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'usuarios',
          method: 'delete',
          match: { id }
        })
      })
      const { error } = await res.json()
      if (error) throw new Error(error)
      fetchUsuarios()
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const filteredUsers = usuarios.filter(u => 
    u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rol?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#323232] dark:text-white tracking-tight">Gestión de Usuarios</h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-slate-500 font-medium">Administra conductores, operadores y administradores.</p>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5 text-[10px] font-black text-[#51872E] uppercase tracking-widest">
              <Shield className="size-3" />
              <span>{usuarios.filter(u => u.password && u.password.length > 0).length} PROTEGIDOS</span>
            </div>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-2xl font-black px-6 shadow-lg shadow-[#116CA2]/20">
           <UserPlus className="size-4 mr-2" />
           Nuevo Usuario
        </Button>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 dark:border-zinc-800">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input 
                placeholder="Buscar por nombre o rol..." 
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
                  <TableHead className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Nombre</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Rol</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Seguridad</TableHead>
                  <TableHead className="px-8 py-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-20 text-center font-bold text-slate-400 italic">Cargando usuarios...</TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={4} className="py-20 text-center font-bold text-slate-400 italic">No se encontraron usuarios</TableCell>
                  </TableRow>
                ) : filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-b border-slate-50 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <TableCell className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-black text-[#116CA2]">
                             {user.nombre?.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-[#323232] dark:text-white uppercase tracking-tight block">{user.nombre}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">ID: {user.id.slice(0, 8)}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-6">
                       <Badge className={cn(
                         "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
                         user.rol === 'master_admin' ? "bg-purple-100 text-purple-600" :
                         user.rol === 'admin' ? "bg-red-100 text-red-600" :
                         user.rol === 'digitalizador' ? "bg-blue-100 text-blue-600" :
                         user.rol === 'operaciones' ? "bg-[#116CA2]/10 text-[#116CA2]" :
                         "bg-[#51872E]/10 text-[#51872E]"
                       )}>
                          {user.rol}
                       </Badge>
                    </TableCell>
                    <TableCell className="py-6">
                       <div className="flex items-center gap-2">
                          {user.password && user.password.length > 0 ? (
                            <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Check className="size-3" />
                              PROTEGIDO
                            </Badge>
                          ) : (
                            <Badge className={cn(
                              "border-none font-black text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1",
                              (user.rol === 'master_admin' || user.rol === 'admin') 
                                ? "bg-amber-100 text-amber-600 animate-pulse" 
                                : "bg-slate-100 text-slate-400"
                            )}>
                              <X className="size-3" />
                              SIN CLAVE
                            </Badge>
                          )}
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right space-x-2">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(user)} className="h-10 w-10 rounded-xl text-slate-400 hover:text-[#116CA2] hover:bg-[#116CA2]/10 transition-all">
                          <Edit2 className="size-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                          <Trash2 className="size-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
           </Table>
        </CardContent>
      </Card>


      {/* User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900">
          <div className="bg-[#116CA2] p-8 text-white">
             <div className="bg-white/20 p-3 rounded-2xl w-fit mb-4">
                <Shield className="size-8" />
             </div>
             <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
             <DialogDescription className="text-white/60 font-medium">Configura los permisos y credenciales de acceso.</DialogDescription>
          </div>
          
          <div className="p-8 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Completo</Label>
                <Input 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                  placeholder="Ej: Juan Pérez"
                />
             </div>
             
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rol de Usuario</Label>
                <Select value={formData.rol} onValueChange={(val) => setFormData({...formData, rol: val ?? "chofer"})}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]">
                    <SelectValue placeholder="Seleccionar Rol" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-none p-2">
                    <SelectItem value="chofer" className="py-3 font-bold">Conductores (App Móvil)</SelectItem>
                    <SelectItem value="operaciones" className="py-3 font-bold">Jefe de Operaciones</SelectItem>
                    <SelectItem value="digitalizador" className="py-3 font-bold">Digitalizador (Certificados)</SelectItem>
                    <SelectItem value="admin" className="py-3 font-bold">Administrador General</SelectItem>
                    <SelectItem value="master_admin" className="py-3 font-bold">Administrador Maestro</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña</Label>
                <div className="relative">
                   <Key className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                   <Input 
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="h-12 pl-12 pr-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                    placeholder="Generar o asignar clave"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-[#116CA2]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
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
                disabled={!formData.nombre.trim()}
              >
                {editingUser ? "ACTUALIZAR" : "CREAR"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
