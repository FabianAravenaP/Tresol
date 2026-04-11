"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Badge } from "@/components/uib/badge"
import { 
  Utensils, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Clock,
  CalendarDays,
  Clock,
  CalendarDays,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function CocinaMobile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [minutas, setMinutas] = useState<any[]>([])
  const [eleccion, setEleccion] = useState<any>(null)
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const today = format(new Date(), "yyyy-MM-dd")

  useEffect(() => {
    const session = localStorage.getItem('tresol_session')
    if (!session) {
      router.push('/')
      return
    }
    setUser(JSON.parse(session))
    fetchData(JSON.parse(session).id)
  }, [])

  const fetchData = async (userId: string) => {
    setIsLoading(true)
    try {
      // 1. Get today's menu options
      const resMinutas = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'cocina_minutas',
          method: 'select',
          data: '*, receta:cocina_recetas(*, cocina_ingredientes(*))',
          match: { fecha: today }
        })
      })
      const dataMinutas = await resMinutas.json()
      setMinutas(dataMinutas.data || [])

      // 2. Get user's current selection for today
      if (dataMinutas.data?.length > 0) {
        const resEleccion = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'cocina_elecciones',
            method: 'select',
            match: { usuario_id: userId }
          })
        })
        const dataEleccion = await resEleccion.json()
        
        // Find selection for one of today's minutas
        const todayMinutaIds = dataMinutas.data.map((m: any) => m.id)
        const currentEleccion = dataEleccion.data?.find((e: any) => todayMinutaIds.includes(e.minuta_id))
        setEleccion(currentEleccion)
      }
    } catch (error) {
      console.error("Error fetching kitchen data:", error)
      toast.error("Error al cargar datos de cocina")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = async (minutaId: string, asiste: boolean) => {
    if (isSubmitting) return
    
    // Check for 10:00 AM cutoff
    const now = new Date()
    const cutoff = new Date()
    cutoff.setHours(10, 0, 0, 0)
    
    if (now > cutoff) {
      toast.error("El horario de elección ha terminado (Corte 10:00 AM)")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        table: 'cocina_elecciones',
        method: eleccion ? 'update' : 'insert',
        data: {
          usuario_id: user.id,
          minuta_id: minutaId,
          confirmo_asistencia: asiste,
          no_asistira: !asiste,
          hora_eleccion: new Date().toISOString()
        }
      }

      if (eleccion) {
        (payload as any).match = { id: eleccion.id }
      }

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await res.json()
      if (result.error) throw new Error(result.error)

      toast.success(asiste ? "Elección confirmada" : "Registrado como: No asistirá")
      fetchData(user.id)
    } catch (error) {
      console.error("Error submitting selection:", error)
      toast.error("No se pudo registrar tu elección")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Utensils className="size-12 text-slate-300" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Menú...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="bg-[#51872E] text-white p-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 rounded-xl"
            onClick={() => router.back()}
          >
            <ChevronLeft className="size-6" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-black uppercase tracking-tight">Cocina Tresol</h1>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Menú del Día</p>
          </div>
          <div className="size-10" /> {/* Spacer */}
        </div>
        
        <div className="bg-white/10 p-4 rounded-2xl flex items-center gap-4 border border-white/20">
          <div className="p-3 bg-white rounded-xl text-[#51872E]">
            <CalendarDays className="size-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Fecha Actual</p>
            <p className="text-lg font-black capitalize">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
          </div>
        </div>
      </header>

      <main className="px-6 -mt-4 space-y-6">
        <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white ring-1 ring-black/5 animate-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#51872E]">
                <Clock className="size-5" />
                <span className="text-xs font-black uppercase tracking-widest">Estado del Menú</span>
              </div>
              <Badge className={eleccion ? "bg-blue-500" : "bg-orange-500"}>
                {eleccion ? "REGISTRADO" : "PENDIENTE"}
              </Badge>
            </div>

            {minutas.length === 0 ? (
              <div className="text-center py-10 space-y-4">
                <div className="p-4 bg-slate-50 rounded-full w-fit mx-auto">
                    <Info className="size-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold italic">No hay minutas publicadas para hoy todavía.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {minutas.map((m) => (
                  <div 
                    key={m.id}
                    className={`p-6 rounded-3xl border-2 transition-all ${
                      eleccion?.minuta_id === m.id && eleccion.confirmo_asistencia
                      ? 'border-[#51872E] bg-[#51872E]/5' 
                      : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                      <div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-black uppercase text-[#51872E] border-[#51872E]/20 bg-[#51872E]/5">
                                {m.descripcion || "GENERAL"}
                            </Badge>
                        </div>
                        <h3 className="text-lg font-black text-[#323232] leading-tight mt-1">{m.receta?.nombre}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 rounded-full text-slate-300 pointer-events-auto"
                            onClick={() => setExpandedRecipe(expandedRecipe === m.id ? null : m.id)}
                        >
                            {expandedRecipe === m.id ? <ChevronUp className="size-5" /> : <Info className="size-5" />}
                        </Button>
                        {eleccion?.minuta_id === m.id && eleccion.confirmo_asistencia && (
                            <CheckCircle2 className="size-6 text-[#51872E]" />
                        )}
                      </div>
                    </div>

                    {expandedRecipe === m.id && (
                        <div className="mb-4 bg-white/50 rounded-2xl p-4 border border-slate-200/50 animate-in slide-in-from-top-2 duration-300">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Ingredientes Principales</p>
                            <div className="flex flex-wrap gap-2">
                                {m.receta?.cocina_ingredientes?.length > 0 ? (
                                    m.receta.cocina_ingredientes.map((ing: any, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="bg-white border-slate-100 text-[#323232] text-[10px] font-bold">
                                            {ing.nombre}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-slate-400 italic">No hay detalles extra.</p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <Button 
                      className={`w-full rounded-2xl h-12 font-black uppercase tracking-widest transition-all ${
                        eleccion?.minuta_id === m.id && eleccion.confirmo_asistencia
                        ? 'bg-[#51872E] text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                      disabled={isSubmitting}
                      onClick={() => handleSelect(m.id, true)}
                    >
                      {eleccion?.minuta_id === m.id && eleccion.confirmo_asistencia ? 'Elegido' : 'Quiero este menú'}
                    </Button>
                  </div>
                ))}

                <div className="pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => handleSelect(minutas[0].id, false)}
                      className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                        eleccion?.no_asistira 
                        ? 'bg-red-50 text-red-500 border-2 border-red-500/20' 
                        : 'text-slate-400 hover:text-red-500'
                      }`}
                    >
                      {eleccion?.no_asistira ? (
                        <>
                          <XCircle className="size-5" />
                          No asistiré hoy
                        </>
                      ) : (
                        "No consumiré menú hoy"
                      )}
                    </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {eleccion && (
          <div className="p-6 rounded-[2rem] bg-blue-50 border border-blue-100 flex gap-4 animate-in fade-in duration-700">
            <div className="p-3 bg-blue-500 rounded-2xl text-white h-fit">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Registro Guardado</p>
              <p className="text-xs text-blue-600 font-medium mt-1 leading-relaxed">
                Tu elección fue registrada a las {format(new Date(eleccion.hora_eleccion), "HH:mm")}. 
                Puedes modificarla hasta las 10:00 AM.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
