"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Badge } from "@/components/uib/badge"
import { 
  Plus, 
  ArrowLeft, 
  Car, 
  Calendar, 
  Clock, 
  Fuel, 
  Gauge, 
  Camera, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreVertical,
  History,
  ClipboardCheck,
  Smartphone
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from "@/components/uib/dialog"
import { Input } from "@/components/uib/input"
import { Label } from "@/components/uib/label"
import { Textarea } from "@/components/uib/textarea"
import { toast } from "sonner"
import { NavigationHeader } from "@/components/NavigationHeader"

export default function MobileVehiculosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [personalId, setPersonalId] = useState<string | null>(null)
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [isFinishing, setIsFinishing] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    vehiculo_id: "",
    fecha_inicio: new Date().toISOString().slice(0, 16),
    fecha_fin: new Date(Date.now() + 3600000 * 4).toISOString().slice(0, 16),
    motivo: "TRABAJO",
    glosa_motivo: "",
    km_salida: "",
    combustible_salida: 100,
    foto_tablero_salida: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=1000" // Mock for placeholder lab
  })

  useEffect(() => {
    const sessionStr = localStorage.getItem('tresol_session')
    if (sessionStr) {
      const sessionUser = JSON.parse(sessionStr)
      setUser(sessionUser)
      findPersonalRecord(sessionUser.rut)
    } else {
      router.push('/')
    }
  }, [])

  const findPersonalRecord = async (rut: string) => {
    if (!rut) return
    try {
      const { data, error } = await supabase
        .from('maestro_personas')
        .select('id')
        .eq('rut', rut)
        .single()
      
      if (error) throw error
      setPersonalId(data.id)
      fetchData(data.id)
    } catch (err) {
      console.error("Error finding person:", err)
      setIsLoading(false)
    }
  }

  const fetchData = async (pid: string) => {
    setIsLoading(true)
    try {
      // Fetch my solicitudes
      const { data: sData, error: sErr } = await supabase
        .from('solicitudes_vehiculos')
        .select('*, vehiculos(patente, marca, modelo)')
        .eq('usuario_id', pid)
        .order('created_at', { ascending: false })
      
      if (sErr) throw sErr
      setSolicitudes(sData || [])

      // Fetch available minor vehicles
      const { data: vData, error: vErr } = await supabase
        .from('vehiculos')
        .select('*')
        .eq('categoria', 'MENOR')
        .eq('activo', true)
      
      if (vErr) throw vErr
      setVehiculos(vData || [])
    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.vehiculo_id || !formData.km_salida) {
      toast.error("Por favor completa los campos obligatorios.")
      return
    }

    try {
      const { error } = await supabase
        .from('solicitudes_vehiculos')
        .insert([{
          usuario_id: personalId,
          vehiculo_id: formData.vehiculo_id,
          fecha_inicio: formData.fecha_inicio,
          fecha_fin: formData.fecha_fin,
          motivo: formData.motivo,
          glosa_motivo: formData.glosa_motivo,
          km_salida: parseFloat(formData.km_salida),
          combustible_salida: formData.combustible_salida,
          foto_tablero_salida: formData.foto_tablero_salida,
          estado_solicitud: 'PENDIENTE'
        }])
      
      if (error) throw error
      
      toast.success("Solicitud enviada correctamente")
      setIsNewDialogOpen(false)
      fetchData(personalId!)
    } catch (err) {
      console.error("Error saving request:", err)
      toast.error("Error al guardar la solicitud")
    }
  }

  const handleFinish = async (solicitudId: string) => {
     // For simulation, we'll just update to finalizada
     // Ideally, this opens a form for KM retorno
     try {
        const { error } = await supabase
            .from('solicitudes_vehiculos')
            .update({ 
                estado_solicitud: 'FINALIZADA',
                km_retorno: parseFloat(formData.km_salida) + 50, // simulated
                fecha_retorno_real: new Date().toISOString()
            })
            .eq('id', solicitudId)
        
        if (error) throw error
        toast.success("Vehículo retornado correctamente")
        fetchData(personalId!)
     } catch (err) {
        console.error("Error finishing:", err)
     }
  }

  const isWeekend = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDay()
    return day === 0 || day === 6
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <NavigationHeader 
        title="Control Vehículos" 
        subtitle="Flota Menor"
        hideProfile={true}
      />

      <main className="p-5 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
         <div className="flex justify-between items-center px-1">
            <h2 className="text-2xl font-black text-[#323232] uppercase tracking-tight italic">Mis Solicitudes</h2>
            <Button 
                onClick={() => setIsNewDialogOpen(true)}
                className="bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-2xl h-12 px-6 shadow-lg shadow-[#116CA2]/20 font-black uppercase text-xs tracking-widest"
            >
               <Plus className="size-4 mr-2" /> Solicitar
            </Button>
         </div>

         <div className="space-y-4">
            {isLoading ? (
                <div className="py-20 text-center font-bold text-slate-300 animate-pulse">Cargando...</div>
            ) : solicitudes.length === 0 ? (
                <Card className="border-dashed shadow-none rounded-[2rem] bg-white/50 p-10 text-center">
                    <Car className="size-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No tienes solicitudes activas</p>
                </Card>
            ) : solicitudes.map((s) => (
                <Card key={s.id} className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden ring-1 ring-black/5">
                   <div className={cn(
                       "h-2 w-full",
                       s.estado_solicitud === 'PENDIENTE' ? "bg-amber-400" :
                       s.estado_solicitud === 'APROBADA' ? "bg-emerald-400" :
                       s.estado_solicitud === 'RECHAZADA' ? "bg-red-400" : "bg-slate-200"
                   )} />
                   <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center">
                               <Car className="size-5 text-[#116CA2]" />
                            </div>
                            <div>
                               <p className="font-black text-[#323232] uppercase tracking-tight">{s.vehiculos?.patente}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.vehiculos?.marca} {s.vehiculos?.modelo}</p>
                            </div>
                         </div>
                         <Badge className={cn(
                             "text-[9px] font-black border-none px-2 py-1 rounded-lg",
                             s.estado_solicitud === 'PENDIENTE' ? "bg-amber-50 text-amber-600" :
                             s.estado_solicitud === 'APROBADA' ? "bg-emerald-50 text-emerald-600" :
                             s.estado_solicitud === 'RECHAZADA' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-400"
                         )}>
                            {s.estado_solicitud}
                         </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Desde</p>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                               <Calendar className="size-3 text-[#116CA2]" />
                               {new Date(s.fecha_inicio).toLocaleDateString()}
                            </div>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Razón</p>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-[#116CA2]">
                               {s.motivo}
                            </div>
                         </div>
                      </div>

                      {s.estado_solicitud === 'APROBADA' && (
                          <div className="pt-4 border-t border-slate-50">
                             <Button 
                                onClick={() => handleFinish(s.id)}
                                className="w-full bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-2xl h-12 font-black uppercase text-xs tracking-widest shadow-lg shadow-[#116CA2]/20"
                             >
                                <ClipboardCheck className="size-4 mr-2" /> Devolver Vehículo
                             </Button>
                          </div>
                      )}
                      
                      {(isWeekend(s.fecha_inicio) || isWeekend(s.fecha_fin)) && s.estado_solicitud === 'PENDIENTE' && (
                          <div className="mt-4 p-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                             <AlertTriangle className="size-4 text-amber-500 animate-pulse" />
                             <p className="text-[9px] font-bold text-amber-700 leading-tight">
                                Requiere autorización especial de Sandra o Natali por ser fin de semana.
                             </p>
                          </div>
                      )}
                   </CardContent>
                </Card>
            ))}
         </div>
      </main>

      {/* New Request Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="sm:max-w-md w-[94%] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
           <div className="bg-[#116CA2] p-8 text-white relative">
              <div className="bg-white/20 p-3 rounded-2xl w-fit mb-4">
                 <Smartphone className="size-8" />
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Solicitar Vehículo</DialogTitle>
              <DialogDescription className="text-white/70 font-medium">Completa los datos para el programa de control.</DialogDescription>
           </div>
           
           <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide font-sans">
              <div className="space-y-4 pt-1">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Seleccionar Camioneta / Auto</Label>
                    <select 
                        value={formData.vehiculo_id}
                        onChange={(e) => setFormData({...formData, vehiculo_id: e.target.value})}
                        className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#116CA2]"
                    >
                        <option value="">-- Elige un vehículo --</option>
                        {vehiculos.map(v => (
                            <option key={v.id} value={v.id}>{v.patente} - {v.marca} {v.modelo}</option>
                        ))}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Salida</Label>
                        <Input 
                            type="datetime-local"
                            value={formData.fecha_inicio}
                            onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Retorno</Label>
                        <Input 
                            type="datetime-local"
                            value={formData.fecha_fin}
                            onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                        />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Motivo de Uso</Label>
                    <select 
                        value={formData.motivo}
                        onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                        className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#116CA2]"
                    >
                        <option value="TRABAJO">TRABAJO</option>
                        <option value="PERSONAL">CARÁCTER PERSONAL</option>
                        <option value="EMERGENCIA">EMERGENCIA</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Detalle / Destino</Label>
                    <Textarea 
                        value={formData.glosa_motivo}
                        onChange={(e) => setFormData({...formData, glosa_motivo: e.target.value})}
                        className="rounded-xl bg-slate-50 border-none font-medium min-h-[80px]"
                        placeholder="Ej: Traslado de documentos a oficina Osorno"
                    />
                 </div>

                 <div className="border-t border-slate-100 pt-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <Gauge className="size-4 text-[#116CA2]" />
                       <p className="text-xs font-black uppercase tracking-widest text-[#323232]">Evidencia de Kilometraje</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">KM Actual</Label>
                          <Input 
                            type="number"
                            placeholder="000.000"
                            value={formData.km_salida}
                            onChange={(e) => setFormData({...formData, km_salida: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Combustible %</Label>
                          <SliderMock value={formData.combustible_salida} onChange={(val: number) => setFormData({...formData, combustible_salida: val})} />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Foto del Tablero (Obligatoria)</Label>
                       <div className="h-40 rounded-[1.5rem] bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 group active:bg-slate-200 transition-colors cursor-pointer relative overflow-hidden">
                          <Camera className="size-8 text-slate-300" />
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Subir Evidencia</p>
                          <div className="absolute inset-0 bg-[#116CA2]/5 opacity-0 group-hover:opacity-100" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <DialogFooter className="p-8 pt-4 flex gap-3 bg-slate-50/50">
              <Button variant="ghost" className="flex-1 h-12 rounded-xl font-black text-slate-400 uppercase text-xs" onClick={() => setIsNewDialogOpen(false)}>
                 CANCELAR
              </Button>
              <Button 
                onClick={handleSubmit}
                className="flex-[2] h-12 rounded-xl bg-[#116CA2] hover:bg-[#0d5985] text-white font-black uppercase text-xs shadow-lg shadow-[#116CA2]/20"
              >
                 ENVIAR SOLICITUD
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SliderMock({ value, onChange }: any) {
    return (
        <div className="flex items-center gap-3 h-12 bg-slate-50 rounded-xl px-4">
           <Fuel className="size-3 text-slate-400" />
           <input 
            type="range" 
            min="0" 
            max="100" 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="flex-1 accent-[#116CA2]"
           />
           <span className="text-[10px] font-black text-slate-500 w-8">{value}%</span>
        </div>
    )
}
