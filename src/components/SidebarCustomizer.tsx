"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/uib/dialog"
import { Button } from "@/components/uib/button"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  MapPin, 
  Activity, 
  Users, 
  Truck, 
  Settings, 
  Home, 
  Smartphone, 
  FileText,
  Check,
  Plus
} from "lucide-react"

interface SidebarCustomizerProps {
  isOpen: boolean
  onClose: () => void
  currentConfig: any[]
  onSave: (newConfig: any[]) => void
}

export function SidebarCustomizer({ isOpen, onClose, currentConfig, onSave }: SidebarCustomizerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(currentConfig.map(c => c.id))

  const allAvailableModules = [
    { id: "operativo", name: "Panel Operativo", href: "/operaciones", type: "status", color: "bg-emerald-500", category: "Operaciones" },
    { id: "monitoreo", name: "Monitoreo GPS", href: "/operaciones/monitoreo", type: "icon", icon: "MapPin", category: "Operaciones" },
    { id: "conductores", name: "Gestión Conductores", href: "/admin/conductores", type: "icon", icon: "Truck", category: "Administración" },
    { id: "porteria", name: "Control Portería", href: "/porteria", type: "status", color: "bg-blue-500", category: "Operaciones" },
    { id: "digitalizador", name: "Digitalizador", href: "/digitalizador", type: "status", color: "bg-amber-500", category: "Administración" },
    { id: "analiticas", name: "Analíticas", href: "/admin/analiticas", type: "icon", icon: "Activity", category: "Administración" },
    { id: "usuarios", name: "Usuarios", href: "/admin/usuarios", type: "icon", icon: "Users", category: "Administración" },
    { id: "flota", name: "Maestro Flota", href: "/admin/flota", type: "icon", icon: "Truck", category: "Administración" },
    { id: "personal", name: "Personal", href: "/admin/personal", type: "icon", icon: "Users", category: "Administración" },
    { id: "clientes", name: "Clientes", href: "/admin/clientes", type: "icon", icon: "MapPin", category: "Administración" },
    { id: "activos", name: "Gestión Activos", href: "/activos", type: "status", color: "bg-indigo-500", category: "Administración" },
  ]

  const toggleModule = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleApply = () => {
    const newConfig = allAvailableModules.filter(m => selectedIds.includes(m.id))
    onSave(newConfig)
  }

  const IconMap: any = { LayoutDashboard, MapPin, Activity, Users, Truck, Settings, Home, Smartphone, FileText }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900">
        <div className="bg-[#116CA2] p-8 text-white">
           <div className="bg-white/20 p-3 rounded-2xl w-fit mb-4">
              <Settings className="size-8" />
           </div>
           <DialogTitle className="text-2xl font-black uppercase tracking-tight">Personalizar Accesos</DialogTitle>
           <DialogDescription className="text-white/60 font-medium">Selecciona los módulos que deseas tener a mano en tu barra lateral.</DialogDescription>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto grid grid-cols-2 gap-4">
           {allAvailableModules.map((mod) => {
             const isSelected = selectedIds.includes(mod.id)
             const Icon = mod.icon ? IconMap[mod.icon] : null

             return (
               <button
                 key={mod.id}
                 onClick={() => toggleModule(mod.id)}
                 className={cn(
                   "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group",
                   isSelected 
                    ? "border-[#116CA2] bg-blue-50/50 dark:bg-blue-900/10" 
                    : "border-slate-50 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700"
                 )}
               >
                 <div className={cn(
                   "size-10 rounded-xl flex items-center justify-center transition-colors",
                   isSelected ? "bg-[#116CA2] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400 group-hover:text-slate-600"
                 )}>
                   {Icon ? <Icon className="size-5" /> : mod.color ? <div className={cn("size-2 rounded-full", mod.color)} /> : <Plus className="size-5" />}
                 </div>
                 <div className="flex-1">
                    <p className={cn("text-sm font-black uppercase tracking-tight", isSelected ? "text-[#116CA2]" : "text-slate-600 dark:text-slate-300")}>{mod.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{mod.category}</p>
                 </div>
                 {isSelected && <div className="bg-[#116CA2] rounded-full p-1"><Check className="size-3 text-white" /></div>}
               </button>
             )
           })}
        </div>

        <DialogFooter className="p-8 pt-0 flex gap-3">
           <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold text-slate-400" onClick={onClose}>
              CANCELAR
           </Button>
           <Button 
              onClick={handleApply}
              className="flex-1 h-12 rounded-xl bg-[#116CA2] hover:bg-[#0d5985] text-white font-black shadow-lg shadow-[#116CA2]/20"
           >
              GUARDAR PREFERENCIAS
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}