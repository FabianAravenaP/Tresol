"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Input } from "@/components/uib/input"
import { Label } from "@/components/uib/label"
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
  FileText,
  Camera,
  ArrowRight,
  ChevronRight,
  History,
  ShieldCheck,
  Fuel,
  Gauge
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

export default function MobilePrestamosPage() {
  const [sessionUser, setSessionUser] = useState<any>(null)
  const [isAuthLoaded, setIsAuthLoaded] = useState(false)
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState<any[]>([])

  const AUTHORIZED_PERSONNEL = [
    "sandra paillaman", "ramon ampuero", "yohanny alvarado", "jeanette vargas", "macarena santana", "natali soto",
    "fabian aravena", "martin riquelme", "natalia muñoz", "victoria malizia", "lady irazi", "sebastian torres",
    "ignacio hueichan", "rocio caceres", "claudio alcaino", "omar paredes", "rodolfo soto", "claudio arzola",
    "hans cornejo", "fabian hernandez", "marcelo jara"
  ]

  const normalizeString = (str: string) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  }

  const [checkoutModal, setCheckoutModal] = useState<{isOpen: boolean, reqId: string | null}>({isOpen: false, reqId: null})
  const [returnModal, setReturnModal] = useState<{isOpen: boolean, reqId: string | null}>({isOpen: false, reqId: null})


  // Form State
  const [formData, setFormData] = useState({
    vehiculo_id: "",
    motivo: "TRABAJO",
    fecha_inicio: "",
    hora_inicio: "08:00",
    fecha_fin: "",
    hora_fin: "18:00"
  })

  const [checkoutData, setCheckoutData] = useState({
    km: "",
    combustible: 100,
    fotoBase64: "", // tablero
    fotoDanoBase64: "" // optional daño
  })

  const [returnData, setReturnData] = useState({
    km: "",
    combustible: 100,
    fotoBase64: "", // tablero
    limpieza: "BUENA",
    fotoLimpiezaBase64: "", // required limpieza
    danos: ""
  })

  useEffect(() => {
    const s = localStorage.getItem('tresol_session')
    if (s) {
      const parsed = JSON.parse(s)
      setSessionUser(parsed)
      if (parsed.persona_id) {
         fetchMisSolicitudes(parsed.persona_id)
      }
    }
    setIsAuthLoaded(true)
    fetchVehiculos()
  }, [])

  const fetchVehiculos = async () => {
    try {
      const resVeh = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'vehiculos',
          method: 'select',
          data: 'id, patente, marca, modelo, estado',
          match: { 
            estado: 'OPERATIVO',
            categoria: 'MENOR'
          }
        })
      })
      const { data: vehiculos } = await resVeh.json()

      const resSol = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'solicitudes_vehiculos',
          method: 'select',
          data: 'vehiculo_id, estado_solicitud'
        })
      })
      const { data: solicitudes } = await resSol.json()

      if (vehiculos) {
        const authStates = ['PENDIENTE', 'APROBADA', 'EN_USO'];
        const blockedIds = (solicitudes || [])
          .filter((s:any) => s.vehiculo_id && authStates.includes(s.estado_solicitud))
          .map((s:any) => s.vehiculo_id);

        const availablePool = vehiculos.filter((v:any) => !blockedIds.includes(v.id));
        setVehiculosDisponibles(availablePool);
      }
    } catch (e) {
      console.error(e)
    }
  }

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
      const { data, success } = await res.json()
      if (success) {
        const sortedData = (data || []).sort((a: any, b: any) => 
          new Date(b.created_at || new Date()).getTime() - new Date(a.created_at || new Date()).getTime()
        )
        setSolicitudes(sortedData)
      }
    } catch (err) {
      console.error("Error fetching solicitudes", err)
    } finally {
      setIsLoading(false)
    }
  }

  const activeLoan = useMemo(() => solicitudes.find(s => s.estado_solicitud === 'EN_USO'), [solicitudes])
  const pendingApproval = useMemo(() => solicitudes.find(s => s.estado_solicitud === 'APROBADA'), [solicitudes])

  const isWeekendRequest = useMemo(() => {
    if (!formData.fecha_inicio) return false
    const date = new Date(formData.fecha_inicio)
    const day = date.getDay() // 0 is Sunday, 1 is Monday, ..., 5 is Friday, 6 is Saturday
    return [0, 6].includes(day)
  }, [formData.fecha_inicio])

  const isAuthorized = useMemo(() => {
    if (!sessionUser?.nombre) return false;
    const userNormalized = normalizeString(sessionUser.nombre);
    return AUTHORIZED_PERSONNEL.some(name => {
      const parts = normalizeString(name).split(" ");
      return parts.every(part => userNormalized.includes(part));
    });
  }, [sessionUser])

  const handleSubmit = async () => {
    if (!formData.fecha_inicio || !formData.fecha_fin) {
       alert("Ambas fechas son obligatorias")
       return
    }
    const startDateTime = new Date(`${formData.fecha_inicio}T${formData.hora_inicio}:00`)
    const endDateTime = new Date(`${formData.fecha_fin}T${formData.hora_fin}:00`)
    if (endDateTime <= startDateTime) {
       alert("La fecha/hora de término debe ser mayor a la de inicio")
       return
    }
    if (!sessionUser?.persona_id) {
       alert("Cierre sesión e inicie nuevamente.")
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
            usuario_id: sessionUser.persona_id,
            motivo: formData.motivo,
            vehiculo_id: formData.vehiculo_id || null,
            fecha_inicio: startDateTime.toISOString(),
            fecha_fin: endDateTime.toISOString(),
            estado_solicitud: 'PENDIENTE',
          }
        })
      })
      if (!res.ok) throw new Error('Error de conexión con el servidor: ' + res.status)
      const { success, error } = await res.json()
      if (success) {
        setIsRequestModalOpen(false)
        fetchMisSolicitudes(sessionUser.persona_id)
        fetchVehiculos()
        setFormData({ vehiculo_id: "", motivo: "TRABAJO", fecha_inicio: "", hora_inicio: "08:00", fecha_fin: "", hora_fin: "18:00" })
      } else {
        alert("Error al procesar reserva: " + (error || "Desconocido"))
      }
    } catch (err: any) {
      console.error(err)
      alert("Falla de conectividad: " + err.message)
    } finally { setIsSubmitting(false) }
  }

  const handlePhotoCapture = (e: any, type: 'CHECKOUT_TABLERO' | 'CHECKOUT_DANO' | 'RETURN_TABLERO' | 'RETURN_LIMPIEZA') => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 800
          const MAX_HEIGHT = 800
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          const base64 = canvas.toDataURL('image/jpeg', 0.6)
          
          if (type === 'CHECKOUT_TABLERO') setCheckoutData(prev => ({ ...prev, fotoBase64: base64 }))
          else if (type === 'CHECKOUT_DANO') setCheckoutData(prev => ({ ...prev, fotoDanoBase64: base64 }))
          else if (type === 'RETURN_TABLERO') setReturnData(prev => ({ ...prev, fotoBase64: base64 }))
          else if (type === 'RETURN_LIMPIEZA') setReturnData(prev => ({ ...prev, fotoLimpiezaBase64: base64 }))
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const submitTechnicalLog = async (type: 'CHECKOUT' | 'RETURN') => {
    if (type === 'CHECKOUT' && (!checkoutData.km || !checkoutData.fotoBase64)) {
      alert("Kilometraje y foto del tablero son requeridos para la salida.")
      return
    }
    if (type === 'RETURN' && (!returnData.km || !returnData.fotoBase64 || !returnData.fotoLimpiezaBase64)) {
      alert("Kilometraje, foto de tablero y foto de limpieza son obligatorios al retornar.")
      return
    }
    const reqId = type === 'CHECKOUT' ? checkoutModal.reqId : returnModal.reqId
    const updateData = type === 'CHECKOUT'
      ? { 
          km_salida: Number(checkoutData.km), 
          combustible_salida: checkoutData.combustible, 
          foto_tablero_salida: checkoutData.fotoBase64, 
          foto_dano_salida: checkoutData.fotoDanoBase64 || null,
          estado_solicitud: 'EN_USO' 
        }
      : { 
          km_retorno: Number(returnData.km), 
          combustible_retorno: returnData.combustible, 
          foto_tablero_retorno: returnData.fotoBase64, 
          limpieza: returnData.limpieza, 
          foto_limpieza_retorno: returnData.fotoLimpiezaBase64,
          danos_retorno_notas: returnData.danos, 
          estado_solicitud: 'FINALIZADA' 
        }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'solicitudes_vehiculos', method: 'update', data: updateData, match: { id: reqId } })
      })
      if (!res.ok) throw new Error('Carga fallida o muy pesada. Status: ' + res.status)
      const resJson = await res.json()
      if (resJson.success) {
        setCheckoutModal({isOpen: false, reqId: null})
        setReturnModal({isOpen: false, reqId: null})
        fetchMisSolicitudes(sessionUser.persona_id)
      } else {
        alert("Error en el registro técnico: " + (resJson.error || "Desconocido"))
      }
    } catch (e: any) { 
      console.error(e)
      alert("Error de envío: " + e.message)
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-12rem)] space-y-6 pb-20 relative px-2">
      
      {!isAuthLoaded ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 animate-pulse">
           <Car className="size-10 text-slate-300 mx-auto mb-4" />
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Verificando Credenciales...</p>
        </div>
      ) : !isAuthorized ? (
        <div className="flex-1 flex flex-col items-center justify-center pt-20 px-4">
           <Card className="w-full max-w-sm rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden text-center">
              <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100">
                 <ShieldCheck className="size-16 text-red-500 mb-2" />
                 <h2 className="text-xl font-black text-red-700 uppercase tracking-tight">Acceso Restringido</h2>
              </div>
              <div className="p-8 space-y-4">
                 <p className="text-sm font-bold text-slate-500 leading-relaxed">
                   Tu perfil (<span className="text-[#323232]">{sessionUser?.nombre}</span>) no cuenta con los permisos administrativos para solicitar vehículos de la flota menor.
                 </p>
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-loose">
                      Para solicitar excepciones, comunícate con la Gerencia de Operaciones.
                    </p>
                 </div>
              </div>
           </Card>
        </div>
      ) : (
        <>
          {/* Header Context - Very Mobile Optimized */}
      <div className="bg-[#116CA2] rounded-[2rem] p-6 text-white shadow-xl shadow-[#116CA2]/20 mb-2">
        <div className="flex justify-between items-start mb-6">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1 leading-none">Préstamo de Vehículo</p>
              <h2 className="text-2xl font-black uppercase tracking-tight">Centro de Control</h2>
           </div>
           <div className="bg-white/20 p-3 rounded-2xl">
              <Car className="size-6 text-white" />
           </div>
        </div>
        
        {/* Status Quick Look */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
              <p className="text-[9px] font-black uppercase text-white/50 tracking-wider mb-1">Total Solicitudes</p>
              <h4 className="text-xl font-black">{solicitudes.length}</h4>
           </div>
           <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
              <p className="text-[9px] font-black uppercase text-white/50 tracking-wider mb-1">Estado Actual</p>
              <h4 className="text-[11px] font-black uppercase">{activeLoan ? 'En Uso' : (pendingApproval ? 'Por Retirar' : 'Sin Préstamo')}</h4>
           </div>
        </div>
      </div>

      {/* Primary Action Card - Priority #1 for the user */}
      {activeLoan ? (
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden p-6 relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Car className="size-24" />
          </div>
          <div className="relative z-10 space-y-4">
             <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
                   <AlertCircle className="size-6 text-white animate-pulse" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Vehículo en Uso</p>
                   <h3 className="text-xl font-black tracking-tight">{activeLoan.vehiculo?.patente}</h3>
                </div>
             </div>
             <p className="text-xs font-bold text-white/90">Recuerda reportar el retorno una vez devuelto el vehículo para cerrar el ciclo.</p>
             <Button 
                onClick={() => setReturnModal({isOpen: true, reqId: activeLoan.id})}
                className="w-full h-14 bg-white text-emerald-600 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-white/90"
             >
                <CheckCircle2 className="size-5 mr-3" />
                Registrar Retorno
             </Button>
          </div>
        </Card>
      ) : pendingApproval ? (
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden p-6 relative">
          <div className="relative z-10 space-y-4">
             <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
                   <Clock className="size-6 text-white" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Esperando Retiro</p>
                   <h3 className="text-xl font-black tracking-tight">{pendingApproval.vehiculo?.patente || 'Vehículo Asignado'}</h3>
                </div>
             </div>
             <Button 
                onClick={() => setCheckoutModal({isOpen: true, reqId: pendingApproval.id})}
                className="w-full h-14 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
             >
                <ArrowRight className="size-5 mr-3" />
                Iniciar Salida
             </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-500">
           <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 pl-2">Vehículos Disponibles ({vehiculosDisponibles.length})</h3>
           {vehiculosDisponibles.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center text-slate-400">
                 <Car className="size-12 mx-auto mb-3 opacity-20" />
                 <p className="text-[10px] font-black uppercase tracking-widest">No hay vehículos en el pool</p>
              </div>
           ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {vehiculosDisponibles.map(v => (
                    <Card key={v.id} className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer" onClick={() => {
                       setFormData({ ...formData, vehiculo_id: v.id });
                       setIsRequestModalOpen(true);
                    }}>
                       <div className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="size-12 rounded-2xl bg-[#116CA2]/10 text-[#116CA2] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Car className="size-6" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-tight">{v.marca} {v.modelo}</p>
                                <h4 className="text-lg font-black tracking-tight text-[#323232]">{v.patente}</h4>
                             </div>
                          </div>
                          <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-[#116CA2] group-hover:bg-[#116CA2] group-hover:text-white transition-colors">
                             <Plus className="size-5" />
                          </div>
                       </div>
                    </Card>
                 ))}
              </div>
           )}
        </div>
      )}

      {/* History / Recent Activity */}
      <div className="space-y-4">
         <div className="flex items-center justify-between px-2">
            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
               <History className="size-4" />
               Historial Reciente
            </h5>
         </div>

         {isLoading ? (
           <div className="p-10 text-center opacity-30 animate-pulse italic font-bold">Cargando...</div>
         ) : solicitudes.filter(s => s.estado_solicitud !== 'EN_USO' && s.estado_solicitud !== 'APROBADA').length === 0 ? (
           <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
              <Car className="size-12 text-slate-200 mx-auto mb-3" />
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Sin actividad reciente</p>
           </div>
         ) : (
           <div className="space-y-4 pb-10">
              {solicitudes.filter(s => s.estado_solicitud !== 'EN_USO' && s.estado_solicitud !== 'APROBADA').slice(0, 5).map((req) => (
                <div key={req.id} className="bg-white dark:bg-zinc-900 p-5 rounded-[1.5rem] shadow-md border border-slate-50 dark:border-zinc-800 flex items-center justify-between group active:scale-[0.98] transition-all">
                   <div className="flex items-center gap-4">
                      <div className={cn(
                        "size-12 rounded-2xl flex items-center justify-center",
                        req.estado_solicitud === 'PENDIENTE' ? "bg-amber-50 text-amber-500" :
                        req.estado_solicitud === 'FINALIZADA' ? "bg-emerald-50 text-emerald-500" :
                        req.estado_solicitud === 'RECHAZADA' ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400"
                      )}>
                         {req.estado_solicitud === 'PENDIENTE' ? <Clock className="size-6" /> :
                          req.estado_solicitud === 'FINALIZADA' ? <CheckCircle2 className="size-6" /> :
                          req.estado_solicitud === 'RECHAZADA' ? <XCircle className="size-6" /> : <Car className="size-6" />}
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{new Date(req.created_at).toLocaleDateString()}</p>
                         <h4 className="text-sm font-black text-[#323232] dark:text-white uppercase tracking-tight">
                            {req.vehiculo?.patente || 'Sin vehículo'}
                         </h4>
                         <Badge className={cn(
                           "text-[8px] font-black px-2 py-0 border-none mt-1",
                           req.estado_solicitud === 'PENDIENTE' ? "bg-amber-100 text-amber-700" :
                           req.estado_solicitud === 'FINALIZADA' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                         )}>
                            {req.estado_solicitud}
                         </Badge>
                      </div>
                   </div>
                   <ChevronRight className="size-5 text-slate-300" />
                </div>
              ))}
           </div>
         )}
      </div>

      {/* Floating Button removed in favor of Grid Cards */}

      {/* New Request Modal - Mobile First Design */}
      <Dialog open={isRequestModalOpen} onOpenChange={(val: boolean) => {
         setIsRequestModalOpen(val);
         if (!val) setFormData({ ...formData, vehiculo_id: "" });
      }}>
        <DialogContent className="w-[95vw] max-w-lg rounded-[2.5rem] p-6 border-none shadow-2xl bg-white dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
           <DialogHeader className="mb-6">
              <div className="size-12 rounded-2xl bg-[#116CA2]/10 flex items-center justify-center mb-4 text-[#116CA2]">
                 <Car className="size-6" />
              </div>
              <DialogTitle className="text-xl font-black text-[#323232] uppercase tracking-tight">Nueva Solicitud</DialogTitle>
              <DialogDescription className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase">
                 Proporciona los detalles para el control de flota administrativa.
              </DialogDescription>
           </DialogHeader>

           <div className="space-y-5">
              {formData.vehiculo_id && vehiculosDisponibles.find(v => v.id === formData.vehiculo_id) && (
                 <div className="p-4 bg-slate-50 rounded-2xl border-2 border-[#116CA2]/10 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="size-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                       <Car className="size-6 text-[#116CA2]" />
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-[#116CA2]">Vehículo Seleccionado</p>
                       <h4 className="text-sm font-black text-[#323232]">
                          {vehiculosDisponibles.find(v => v.id === formData.vehiculo_id)?.patente} - {vehiculosDisponibles.find(v => v.id === formData.vehiculo_id)?.marca}
                       </h4>
                    </div>
                 </div>
              )}

              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Motivo del Préstamo</Label>
                 <div className="grid grid-cols-2 gap-2">
                    {['TRABAJO', 'PERSONAL', 'URGENCIA'].map((m) => (
                      <button 
                        key={m}
                        type="button"
                        onClick={() => setFormData({...formData, motivo: m})}
                        className={cn(
                          "h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          formData.motivo === m ? "bg-[#116CA2] text-white shadow-lg" : "bg-slate-50 text-slate-400"
                        )}
                      >
                         {m}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-slate-400">Fecha y Hora Retiro</Label>
                    <div className="flex gap-2">
                       <Input type="date" value={formData.fecha_inicio} onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-xs" />
                       <Input type="time" value={formData.hora_inicio} onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-xs w-28" />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-slate-400">Fecha y Hora Devolución</Label>
                    <div className="flex gap-2">
                       <Input type="date" value={formData.fecha_fin} onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-xs" />
                       <Input type="time" value={formData.hora_fin} onChange={(e) => setFormData({...formData, hora_fin: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-xs w-28" />
                    </div>
                 </div>
              </div>

              {isWeekendRequest && (
                <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-100 flex gap-3 text-red-800 animate-in zoom-in-95">
                   <ShieldCheck className="size-6 shrink-0" />
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1">Requiere Autorización</p>
                      <p className="text-[11px] font-bold leading-relaxed">
                        Las solicitudes de fin de semana deben ser aprobadas por **Sandra Paillaman** o **Natali Soto** (Adm. Osorno).
                      </p>
                   </div>
                </div>
              )}
           </div>

           <DialogFooter className="mt-8 flex flex-col-reverse gap-2">
              <Button variant="ghost" className="h-14 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-xs" onClick={() => setIsRequestModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="h-14 bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">
                 {isSubmitting ? "Procesando..." : "Enviar Solicitud"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Wizard - Mobile Optimized */}
      <Dialog open={checkoutModal.isOpen} onOpenChange={(o: boolean) => { if(!o) setCheckoutModal({isOpen: false, reqId: null}) }}>
        <DialogContent className="w-[95vw] max-w-lg rounded-[2.5rem] p-6 border-none shadow-2xl bg-white dark:bg-zinc-900">
          <div className="text-center space-y-6">
             <div className="size-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 border-2 border-blue-100">
                <Gauge className="size-10 text-blue-500" />
             </div>
             <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-[#323232]">Levantamiento Salida</h3>
                <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase">Captura el estado inicial del vehículo.</p>
             </div>
             
             <div className="space-y-6 text-left">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kilometraje Actual</Label>
                   <Input 
                      type="number" 
                      placeholder="Ej. 125000" 
                      value={checkoutData.km} 
                      onChange={(e) => setCheckoutData({...checkoutData, km: e.target.value})} 
                      className="h-16 rounded-2xl bg-slate-50 border-none font-black text-2xl tracking-widest text-center text-[#116CA2]"
                   />
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Combustible Actual</Label>
                   <select value={checkoutData.combustible} onChange={(e) => setCheckoutData({...checkoutData, combustible: Number(e.target.value)})} className="w-full h-14 px-4 rounded-2xl bg-slate-50 border-none font-black text-sm outline-none">
                     {[100,75,50,25,10].map(v => <option key={v} value={v}>{v}%</option>)}
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center block">Evidencia Tablero *</Label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#116CA2]/30 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer overflow-hidden relative bg-blue-50/20">
                         {checkoutData.fotoBase64 ? (
                           <img src={checkoutData.fotoBase64} alt="Tablero" className="w-full h-full object-cover" />
                         ) : (
                           <div className="flex flex-col items-center gap-2 text-[#116CA2]">
                              <Camera className="size-6" />
                              <span className="text-[8px] font-black uppercase text-center">FOTO KM/GAS</span>
                           </div>
                         )}
                         <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoCapture(e, 'CHECKOUT_TABLERO')} />
                      </label>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center block">Evidencia Daños</Label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer overflow-hidden relative">
                         {checkoutData.fotoDanoBase64 ? (
                           <img src={checkoutData.fotoDanoBase64} alt="Daños" className="w-full h-full object-cover" />
                         ) : (
                           <div className="flex flex-col items-center gap-2 text-slate-400">
                              <Camera className="size-6 opacity-50" />
                              <span className="text-[8px] font-black uppercase text-center">FOTO DAÑO<br/>(OPCIONAL)</span>
                           </div>
                         )}
                         <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoCapture(e, 'CHECKOUT_DANO')} />
                      </label>
                   </div>
                </div>
             </div>

             <DialogFooter className="flex flex-col gap-2 pt-4">
                <Button 
                   onClick={() => submitTechnicalLog('CHECKOUT')} 
                   disabled={isSubmitting || !checkoutData.km || !checkoutData.fotoBase64}
                   className="h-16 w-full bg-[#116CA2] rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all"
                >
                   {isSubmitting ? 'Guardando...' : 'Confirmar Salida'}
                </Button>
                <Button variant="ghost" className="h-12 text-slate-300 font-bold" onClick={() => setCheckoutModal({isOpen: false, reqId: null})}>Cancelar</Button>
             </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Wizard - Mobile Optimized */}
      <Dialog open={returnModal.isOpen} onOpenChange={(o: boolean) => { if(!o) setReturnModal({isOpen: false, reqId: null}) }}>
        <DialogContent className="w-[95vw] max-w-lg rounded-[3rem] p-6 border-none shadow-2xl bg-white dark:bg-zinc-900 max-h-[95vh] overflow-y-auto">
          <div className="text-center space-y-6">
             <div className="size-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <Fuel className="size-8 text-emerald-500" />
             </div>
             <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-[#323232]">Finalizar Préstamo</h3>
                <p className="text-xs font-bold text-slate-400 uppercase">Reporte de llegada y estado final.</p>
             </div>
             
             <div className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">KM Retorno</Label>
                      <Input type="number" placeholder="KM" value={returnData.km} onChange={(e) => setReturnData({...returnData, km: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-black text-lg text-center" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Combustible</Label>
                      <select value={returnData.combustible} onChange={(e) => setReturnData({...returnData, combustible: Number(e.target.value)})} className="w-full h-14 px-3 rounded-2xl bg-slate-50 border-none font-black text-sm outline-none">
                        {[100,75,50,25,10].map(v => <option key={v} value={v}>{v}%</option>)}
                      </select>
                   </div>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 text-center block">Limpieza</Label>
                   <div className="flex gap-2">
                      {['EXCELENTE', 'BUENA', 'SUCIA'].map(l => (
                        <button key={l} onClick={() => setReturnData({...returnData, limpieza: l})} className={cn(
                          "flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                          returnData.limpieza === l ? "bg-[#116CA2] text-white shadow-md shadow-[#116CA2]/20" : "bg-slate-50 text-slate-400"
                        )}>{l}</button>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Observaciones / Daños</Label>
                   <textarea value={returnData.danos} onChange={(e) => setReturnData({...returnData, danos: e.target.value})} className="w-full h-24 p-4 rounded-2xl bg-slate-50 border-none font-bold text-sm resize-none focus:ring-2 focus:ring-[#116CA2] outline-none" placeholder="Describe cualquier novedad..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center block">Evidencia Tablero *</Label>
                      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#116CA2]/30 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer overflow-hidden relative bg-blue-50/10 text-[#116CA2]">
                         {returnData.fotoBase64 ? (
                           <img src={returnData.fotoBase64} alt="Tablero" className="w-full h-full object-cover" />
                         ) : (
                           <div className="flex flex-col items-center gap-1">
                              <Camera className="size-6" />
                              <span className="text-[8px] font-black uppercase">FOTO KM/GAS</span>
                           </div>
                         )}
                         <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoCapture(e, 'RETURN_TABLERO')} />
                      </label>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center block">Evidencia Limpieza *</Label>
                      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-emerald-500/30 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer overflow-hidden relative bg-emerald-50/10 text-emerald-600">
                         {returnData.fotoLimpiezaBase64 ? (
                           <img src={returnData.fotoLimpiezaBase64} alt="Limpieza" className="w-full h-full object-cover" />
                         ) : (
                           <div className="flex flex-col items-center gap-1">
                              <Camera className="size-6" />
                              <span className="text-[8px] font-black uppercase">FOTO LIMPIEZA</span>
                           </div>
                         )}
                         <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoCapture(e, 'RETURN_LIMPIEZA')} />
                       </label>
                   </div>
                </div>
             </div>

             <DialogFooter className="flex flex-col gap-2 shrink-0 pt-4">
                <Button 
                   onClick={() => submitTechnicalLog('RETURN')} 
                   disabled={isSubmitting || !returnData.km || !returnData.fotoBase64 || !returnData.fotoLimpiezaBase64}
                   className="h-16 w-full bg-[#116CA2] rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all text-white"
                >
                   {isSubmitting ? 'Enviando...' : 'Finalizar Entrega'}
                </Button>
                <Button variant="ghost" className="h-12 text-slate-300 font-bold" onClick={() => setReturnModal({isOpen: false, reqId: null})}>Cerrar</Button>
             </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  )
}
