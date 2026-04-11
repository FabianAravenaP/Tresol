"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Input } from "@/components/uib/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/uib/table"
import { Badge } from "@/components/uib/badge"
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Key,
  Shield,
  X,
  Check,
  Eye,
  EyeOff,
  LayoutGrid
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/uib/dialog"
import { Label } from "@/components/uib/label"
import { Switch } from "@/components/uib/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/uib/select"
import { ALL_MODULES, parseSidebarConfig, hasDualView, type SidebarEntry } from "@/lib/modules"

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Main user dialog (create / edit)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ nombre: "", rol: "chofer", password: "" })

  // Module assignment dialog
  const [isModulesOpen, setIsModulesOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<any>(null)
  const [moduleConfig, setModuleConfig] = useState<SidebarEntry[]>([])

  useEffect(() => {
    const session = localStorage.getItem('tresol_session')
    if (session) {
      const user = JSON.parse(session)
      const roleUp = (user.rol || '').toUpperCase()
      const isMasterAdmin = user.rol === 'master_admin' ||
        roleUp.includes('ADMIN') || roleUp.includes('GERENTE') || roleUp.includes('JEFE') ||
        user.rut?.toString() === '17630469'
      if (!isMasterAdmin) {
        alert("Acceso denegado. Solo el Administrador Maestro puede gestionar usuarios.")
        window.location.href = '/dashboard'
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
        body: JSON.stringify({ table: 'usuarios', method: 'select' })
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

  // ── User create / edit ─────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormData({ nombre: "", rol: "chofer", password: "" })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (user: any) => {
    setEditingUser(user)
    setFormData({ nombre: user.nombre, rol: user.rol, password: user.password || "" })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim()) return
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'usuarios',
          method: editingUser ? 'update' : 'insert',
          data: { nombre: formData.nombre, rol: formData.rol, password: formData.password },
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
        body: JSON.stringify({ table: 'usuarios', method: 'delete', match: { id } })
      })
      const { error } = await res.json()
      if (error) throw new Error(error)
      fetchUsuarios()
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  // ── Module assignment ──────────────────────────────────────────────────────
  const handleOpenModules = (user: any) => {
    setAssignTarget(user)
    setModuleConfig(parseSidebarConfig(user.config_sidebar))
    setIsModulesOpen(true)
  }

  const toggleModule = (id: string, enabled: boolean) => {
    if (enabled) {
      setModuleConfig(prev => [...prev, { id, view: 'user' }])
    } else {
      setModuleConfig(prev => prev.filter(e => e.id !== id))
    }
  }

  const setModuleView = (id: string, view: "user" | "admin") => {
    setModuleConfig(prev => prev.map(e => e.id === id ? { ...e, view } : e))
  }

  const handleSaveModules = async () => {
    if (!assignTarget) return
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'usuarios',
          method: 'update',
          data: { config_sidebar: moduleConfig },
          match: { id: assignTarget.id }
        })
      })
      const { error } = await res.json()
      if (error) throw new Error(error)
      setIsModulesOpen(false)
      fetchUsuarios()
    } catch (error) {
      console.error("Error saving module config:", error)
      alert("Error al guardar módulos")
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
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
              <span>{usuarios.filter(u => u.password?.length > 0).length} PROTEGIDOS</span>
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
          <div className="border-none shadow-none">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-50 dark:border-zinc-800 hover:bg-transparent">
                  <TableHead className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Nombre</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Rol</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Módulos</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Seguridad</TableHead>
                  <TableHead className="px-8 py-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center font-bold text-slate-400 italic">Cargando usuarios...</TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center font-bold text-slate-400 italic">No se encontraron usuarios</TableCell>
                  </TableRow>
                ) : filteredUsers.map((user) => {
                  const userModules = parseSidebarConfig(user.config_sidebar)
                  return (
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
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none whitespace-nowrap",
                          user.rol === 'master_admin' ? "bg-red-100 text-red-600" :
                          user.rol === 'digitalizador' ? "bg-blue-100 text-blue-600" :
                          user.rol === 'operaciones' ? "bg-[#116CA2]/10 text-[#116CA2]" :
                          "bg-slate-100 text-slate-500"
                        )}>
                          {user.rol || 'USUARIO'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-6">
                        {user.rol === 'master_admin' ? (
                          <Badge className="bg-[#51872E]/10 text-[#51872E] border-none font-black text-[9px] px-2 py-0.5 rounded-md">
                            Acceso Total
                          </Badge>
                        ) : userModules.length > 0 ? (
                          <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[9px] px-2 py-0.5 rounded-md">
                            {userModules.length} módulo{userModules.length !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-600 border-none font-black text-[9px] px-2 py-0.5 rounded-md">
                            Sin asignar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-6">
                        {user.password?.length > 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
                            <Check className="size-3" /> PROTEGIDO
                          </Badge>
                        ) : (
                          <Badge className={cn(
                            "border-none font-black text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1 w-fit",
                            user.rol === 'master_admin' ? "bg-amber-100 text-amber-600 animate-pulse" : "bg-slate-100 text-slate-400"
                          )}>
                            <X className="size-3" /> SIN CLAVE
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-8 py-6 text-right space-x-2 text-nowrap">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleOpenModules(user)}
                          className="h-10 w-10 rounded-xl text-slate-400 hover:text-[#51872E] hover:bg-[#51872E]/10 transition-all"
                          title="Asignar módulos"
                        >
                          <LayoutGrid className="size-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleOpenEdit(user)}
                          className="h-10 w-10 rounded-xl text-slate-400 hover:text-[#116CA2] hover:bg-[#116CA2]/10 transition-all"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleDelete(user.id)}
                          className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── User create/edit dialog ────────────────────────────────────────── */}
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
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cargo / Rol</Label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="h-12 pl-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2] font-bold"
                  placeholder="Ej: GERENTE DE PROCESOS"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña</Label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-12 pl-12 pr-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                  placeholder="Generar o asignar clave"
                />
                <Button
                  type="button" variant="ghost" size="icon"
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

      {/* ── Module assignment dialog ───────────────────────────────────────── */}
      <Dialog open={isModulesOpen} onOpenChange={setIsModulesOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900">
          <div className="bg-[#51872E] p-8 text-white">
            <div className="bg-white/20 p-3 rounded-2xl w-fit mb-4">
              <LayoutGrid className="size-8" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Módulos Asignados</DialogTitle>
            <DialogDescription className="text-white/60 font-medium">
              {assignTarget?.nombre} — activa los módulos a los que tendrá acceso.
            </DialogDescription>
          </div>

          <div className="p-8 max-h-[60vh] overflow-y-auto space-y-3">
            {ALL_MODULES.map((mod) => {
              const entry = moduleConfig.find(e => e.id === mod.id)
              const isEnabled = Boolean(entry)
              const isDual = hasDualView(mod.id)

              return (
                <div
                  key={mod.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all",
                    isEnabled
                      ? "border-[#51872E]/30 bg-[#51872E]/5"
                      : "border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50"
                  )}
                >
                  {/* Toggle */}
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(v) => toggleModule(mod.id, v)}
                  />

                  {/* Module info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-black uppercase tracking-tight text-sm",
                      isEnabled ? "text-[#51872E]" : "text-slate-600 dark:text-slate-300"
                    )}>
                      {mod.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{mod.category}</p>
                  </div>

                  {/* View selector (only for dual-view modules) */}
                  {isEnabled && isDual && (
                    <Select
                      value={entry?.view ?? 'user'}
                      onValueChange={(v: string) => setModuleView(mod.id, v as "user" | "admin")}
                    >
                      <SelectTrigger className="w-32 h-9 rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 font-black text-[11px] uppercase tracking-widest">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )
            })}
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex-1 text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              {moduleConfig.length} módulo{moduleConfig.length !== 1 ? 's' : ''} seleccionado{moduleConfig.length !== 1 ? 's' : ''}
            </div>
            <Button variant="ghost" className="h-12 px-6 rounded-xl font-bold text-slate-400" onClick={() => setIsModulesOpen(false)}>
              CANCELAR
            </Button>
            <Button
              onClick={handleSaveModules}
              className="h-12 px-8 rounded-xl bg-[#51872E] hover:bg-[#406B24] text-white font-black shadow-lg shadow-[#51872E]/20"
            >
              GUARDAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
