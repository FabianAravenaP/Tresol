"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Input } from "@/components/uib/input"
import { Label } from "@/components/uib/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/uib/table"
import { Badge } from "@/components/uib/badge"
import { 
  Car, 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  FileText
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/uib/dialog"
import { cn } from "@/lib/utils"

export default function PrestamoVehiculos() {
  const [sessionUser, setSessionUser] = useState<any>(null)
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    motivo: "TRABAJO",
    fecha_inicio: "",
    hora_inicio: "08:00",
    fecha_fin: "",
    hora_fin: "18:00",
    comentarios: ""
  })

  useEffect(() => {
    const s = localStorage.getItem('tresol_session')
    if (s) {
      const parsed = JSON.parse(s)
      setSessionUser(parsed)
      if (parsed.persona_id) {
         fetchMisSolicitudes(parsed.persona_id)
      } else {
         console.error("El usuario no tiene un perfil vinculado en Maestro Personas.")
      }
    }
  }, [])

  const fetchMisSolicitudes = async (userId: string) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'solicitudes_vehiculos',
          method: 'select',
          data: `
            *,
            vehiculo:vehiculo_id(patente, marca, modelo)
          `,
          match: { usuario_id: userId }
        })
      })

      const { data, error, success } = await res.json()
      if (!success) {
        if (error?.includes('permission denied')) {
           console.log("No table yet?", error);
        }
        throw new Error(error)
      }
      
      // Sort by creation date descending
      const sortedData = (data || []).sort((a: any, b: any) => 
        new Date(b.created_at || new Date()).getTime() - new Date(a.created_at || new Date()).getTime()
      )
      setSolicitudes(sortedData)
    } catch (err) {
      console.error("Error fetching solicitudes", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.fecha_inicio || !formData.fecha_fin) {
       alert("Ambas fechas son obligatorias")
       return
    }

    // Combine date and time
    const startDateTime = new Date(`${formData.fecha_inicio}T${formData.hora_inicio}:00`)
    const endDateTime = new Date(`${formData.fecha_fin}T${formData.hora_fin}:00`)
    
    if (endDateTime <= startDateTime) {
       alert("La fecha/hora de término debe ser mayor a la de inicio")
       return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'solicitudes_vehiculos',
          method: 'insert',
          data: {
            usuario_id: sessionUser.persona_id, // Usar el ID del Maestro Personas para que cruce con el Foreign Key
            motivo: formData.motivo,
            fecha_inicio: startDateTime.toISOString(),
            fecha_fin: endDateTime.toISOString(),
            estado_solicitud: 'PENDIENTE',
            // Omitimos vehiculo_id, el administrador lo asigna al aprobar
          }
        })
      })

      const { error, success } = await res.json()
      if (!success) throw new Error(error)

      setIsModalOpen(false)
      if (sessionUser.persona_id) {
         fetchMisSolicitudes(sessionUser.persona_id)
      }
      
      // Reset form
      setFormData({
        motivo: "TRABAJO",
        fecha_inicio: "",
        hora_inicio: "08:00",
        fecha_fin: "",
        hora_fin: "18:00",
        comentarios: ""
      })
    } catch (err) {
      console.error("Error creating solicitud:", err)
      alert("Hubo un error al enviar la solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#323232] dark:text-white tracking-tight flex items-center gap-3">
            <Car className="size-8 text-[#116CA2]" />
            Mis Préstamos de Vehículos
          </h2>
          <p className="text-slate-500 font-medium tracking-tight">Solicita y haz seguimiento de vehículos para labores de la empresa.</p>
        </div>
        
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#51872E] hover:bg-[#406B24] text-white rounded-2xl h-12 px-6 font-black shadow-lg shadow-[#51872E]/20"
        >
          <Plus className="size-5 mr-2" />
          Nueva Solicitud
        </Button>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-50">
                <TableHead className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Vehículo Asignado / Estado</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Uso Programado</TableHead>
                <TableHead className="py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="py-20 text-center font-bold text-slate-300 italic">Cargando tu historial...</TableCell></TableRow>
              ) : solicitudes.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={3} className="py-20 text-center">
                     <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                        <Car className="size-16 text-slate-300" />
                        <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">No has solicitado vehículos recientemente</p>
                     </div>
                   </TableCell>
                </TableRow>
              ) : solicitudes.map((req) => (
                <TableRow key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="px-8 py-6">
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "size-12 rounded-2xl flex items-center justify-center font-black",
                          req.estado_solicitud === 'PENDIENTE' ? "bg-amber-50 text-amber-500" :
                          req.estado_solicitud === 'APROBADA' || req.estado_solicitud === 'EN_USO' ? "bg-emerald-50 text-emerald-500" :
                          req.estado_solicitud === 'RECHAZADA' ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400"
                        )}>
                           {req.estado_solicitud === 'PENDIENTE' ? <Clock className="size-6" /> :
                            req.estado_solicitud === 'APROBADA' || req.estado_solicitud === 'EN_USO' ? <CheckCircle2 className="size-6" /> :
                            req.estado_solicitud === 'RECHAZADA' ? <XCircle className="size-6" /> : <AlertCircle className="size-6" />}
                        </div>
                        <div>
                           <Badge className={cn(
                             "text-[9px] font-black border-none px-2 py-0.5 rounded-md mb-1",
                              req.estado_solicitud === 'PENDIENTE' ? "bg-amber-100 text-amber-600" :
                              req.estado_solicitud === 'APROBADA' || req.estado_solicitud === 'EN_USO' ? "bg-emerald-100 text-emerald-600" :
                              "bg-slate-100 text-slate-400"
                           )}>
                              {req.estado_solicitud}
                           </Badge>
                           {req.vehiculo_id ? (
                             <p className="font-black text-[#323232] uppercase tracking-tight leading-none mt-1">
                                {req.vehiculo?.patente}
                             </p>
                           ) : (
                             <p className="text-[11px] font-bold text-slate-400 mt-1">Esperando asignación</p>
                           )}
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="py-6">
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <Calendar className="size-4 text-[#116CA2]" />
                        <div className="space-y-0.5">
                           <p>Inicio: {new Date(req.fecha_inicio).toLocaleDateString()} {new Date(req.fecha_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                           <p>Aprox: {new Date(req.fecha_fin).toLocaleDateString()} {new Date(req.fecha_fin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="py-6">
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          "text-[9px] font-black border-none px-3 py-1 rounded-lg uppercase tracking-widest",
                          req.motivo === 'TRABAJO' ? "bg-blue-100 text-blue-600" :
                          req.motivo === 'PERSONAL' ? "bg-purple-100 text-purple-600" : "bg-red-100 text-red-600"
                        )}>
                           {req.motivo}
                        </Badge>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-8 border-none shadow-2xl">
           <DialogHeader className="mb-6">
              <div className="size-14 rounded-2xl bg-[#116CA2]/10 flex items-center justify-center mb-6">
                 <Car className="size-7 text-[#116CA2]" />
              </div>
              <DialogTitle className="text-2xl font-black text-[#323232] uppercase tracking-tight">Nueva Solicitud</DialogTitle>
              <DialogDescription className="font-bold text-slate-500">
                 Complete los datos. La asignación del vehículo dependerá de la disponibilidad de la flota y aprobación del gestor.
              </DialogDescription>
           </DialogHeader>

           <div className="space-y-6">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Motivo del Préstamo</Label>
                 <select 
                    value={formData.motivo}
                    onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#116CA2] font-bold text-slate-600 outline-none transition-all"
                 >
                    <option value="TRABAJO">Actividad Laboral / Operativa</option>
                    <option value="PERSONAL">Actividad Personal (Aprobación Especial)</option>
                    <option value="URGENCIA">Urgencia Empresa</option>
                 </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Retiro</Label>
                    <Input 
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                      className="bg-slate-50 border-none h-12 rounded-xl font-bold"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hora Aprox.</Label>
                    <Input 
                      type="time"
                      value={formData.hora_inicio}
                      onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})}
                      className="bg-slate-50 border-none h-12 rounded-xl font-bold"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Devolución</Label>
                    <Input 
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                      className="bg-slate-50 border-none h-12 rounded-xl font-bold"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hora Aprox.</Label>
                    <Input 
                      type="time"
                      value={formData.hora_fin}
                      onChange={(e) => setFormData({...formData, hora_fin: e.target.value})}
                      className="bg-slate-50 border-none h-12 rounded-xl font-bold"
                    />
                 </div>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-amber-800">
                 <AlertCircle className="size-5 shrink-0" />
                 <p className="text-xs font-bold leading-relaxed">Las solicitudes para los fines de semana requieren coordinación y pase directo con Administración Central de Osorno.</p>
              </div>
           </div>

           <DialogFooter className="mt-8 gap-3 sm:gap-0">
             <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
             <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-xl font-black px-8"
             >
                {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
