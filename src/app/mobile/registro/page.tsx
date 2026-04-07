"use client"
export const dynamic = 'force-dynamic'

import * as React from "react"
import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import SignatureCanvas from "react-signature-canvas"

import { Button } from "@/components/uib/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/uib/card"
import { Input } from "@/components/uib/input"
import { Label } from "@/components/uib/label"
import { Textarea } from "@/components/uib/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/uib/select"
import { Save, ClipboardCheck } from "lucide-react"
import { NavigationHeader } from "@/components/NavigationHeader"
import { cn } from "@/lib/utils"

function RegistroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const servicioId = searchParams.get("servicio_id")
  
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [vehiculoId, setVehiculoId] = useState<string | null>(null)
  const sigCanvas = useRef<any>(null)

  // Form State based on paper image
  const [form, setForm] = useState({
    empresa: "",
    planta_lugar: "",
    hora_ingreso: "",
    ampm_ingreso: "AM",
    patente: "",
    conductor: "",
    tipo_detalle: "",
    destino_tipo: "vertedero",
    contenedor_tipo: "compactador",
    salida_pm: "",
    salida_nombre: "",
    salida_rut: "",
    observaciones: "",
    folio: ""
  })

  // Selected Waste Category and quantities
  const [waste, setWaste] = useState({
    categoria: "asimilables",
    unidad: "m3",
    valor: ""
  })

  useEffect(() => {
    setMounted(true)
    
    // Auto-fill Current Time
    const now = new Date()
    const hours = now.getHours()
    const mins = now.getMinutes().toString().padStart(2, '0')
    const displayHours = hours % 12 || 12
    const ampm = hours >= 12 ? 'PM' : 'AM'
    
    setForm(prev => ({
      ...prev,
      hora_ingreso: `${displayHours}:${mins}`,
      ampm_ingreso: ampm
    }))

    if (servicioId) {
       const fetchServiceData = async (id: string) => {
         const res = await fetch('/api/proxy', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             table: 'servicios_asignados',
             method: 'select',
             data: '*, vehiculos:vehiculo_id(patente, resolucion_sanitaria), usuarios:chofer_id(nombre)',
             match: { id }
           })
         })
         const { data: rows } = await res.json()
         const data = rows?.[0]

         if (data) {
            setVehiculoId(data.vehiculo_id)
            setForm(prev => ({
              ...prev,
             patente: (data.vehiculos as any)?.patente || "",
             conductor: (data.usuarios as any)?.nombre || "",
             empresa: data.origen || "",
             destino_tipo: "vertedero"
           }))
         }
       }
        fetchServiceData(servicioId as string)
    }

    // Fetch next auto-incrementing folio
    const fetchNextFolio = async () => {
      try {
        const res = await fetch('/api/folio')
        const data = await res.json()
        if (data.folio) {
          setForm(prev => ({ ...prev, folio: data.folio.toString() }))
        }
      } catch (err) {
        console.error("Error fetching auto-folio:", err)
      }
    }
    fetchNextFolio()
  }, [servicioId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Log to CSV (existing behavior)
      const loggerRes = await fetch('/api/logger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...form,
            nombre_conductor: form.conductor, // Map for Logger API expectation
            categoria: waste.categoria,
            valor: waste.valor,
            unidad: waste.unidad,
            servicio_id: servicioId
        })
      })
      if (!loggerRes.ok) throw new Error("Error en servidor de registro (CSV)")

      // 2. Update Database via Proxy (Status -> completado)
      const statusRes = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'servicios_asignados',
          method: 'update',
          data: { estado: 'completado' },
          match: { id: servicioId }
        })
      })
      if (!statusRes.ok) throw new Error("Error al actualizar estado en base de datos")

      // 3. Update Vehicle back to OPERATIVO/DISPONIBLE if needed
      if (vehiculoId) {
        await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'vehiculos',
            method: 'update',
            data: { 
              estado: 'OPERATIVO',
              reporte_falla_at: null 
            },
            match: { id: vehiculoId }
          })
        })
      }

      alert("Servicio finalizado y comprobante enviado exitosamente")
      router.push("/mobile")
    } catch (err: any) {
      console.error("Submit error:", err)
      alert("Error al finalizar: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0] dark:bg-zinc-950">
      <NavigationHeader 
        title="Registro de Servicio" 
        subtitle="Comprobante Digital" 
        showBack={true} 
      />

      <main className="p-4 pb-10 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Folio */}
          <Card className="border-slate-100 dark:border-zinc-800 shadow-md bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden">
            <div className="h-1 w-full bg-[#116CA2]" />
            <CardContent className="p-5 flex items-center gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="folio" className="text-[10px] uppercase font-black text-[#116CA2] dark:text-blue-400 flex items-center gap-2 tracking-widest">
                  <ClipboardCheck className="size-3" /> Folio Documento Físico
                </Label>
                <Input 
                  id="folio"
                  placeholder="Ej: 212191"
                  value={form.folio}
                  onChange={e => setForm({...form, folio: e.target.value})}
                  className="h-14 text-3xl font-black tracking-tighter border-none bg-slate-50 dark:bg-zinc-950 px-4 rounded-xl focus-visible:ring-1 focus-visible:ring-[#116CA2]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Waste Selection */}
          <Card className="border-slate-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden">
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Categoría de Residuo</Label>
                <Select value={waste.categoria} onValueChange={(v: string) => v && setWaste({...waste, categoria: v})}>
                  <SelectTrigger className="h-12 border-slate-100 dark:border-zinc-800 rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asimilables">Asimilables a Urbanos</SelectItem>
                    <SelectItem value="lodos">Lodos Biológicos</SelectItem>
                    <SelectItem value="escombros">Escombros</SelectItem>
                    <SelectItem value="peligrosos">Residuos Peligrosos</SelectItem>
                    <SelectItem value="industriales">Industriales No Peligrosos</SelectItem>
                    <SelectItem value="valorizables">Residuos Valorizables</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex bg-slate-50 dark:bg-zinc-950 p-1.5 rounded-xl gap-2">
                  {['m3', 'kilos'].map((u) => (
                    <Button 
                      key={u}
                      type="button"
                      variant={waste.unidad === u ? 'default' : 'ghost'} 
                      onClick={() => setWaste({...waste, unidad: u})}
                      className={cn(
                        "flex-1 rounded-lg h-10 font-black text-[10px] uppercase tracking-widest transition-all",
                        waste.unidad === u ? "bg-[#116CA2] text-white shadow-md" : "text-slate-400"
                      )}
                    >
                      {u === 'm3' ? 'Metros Cúbicos' : 'Kilogramos'}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-[#116CA2] tracking-widest flex justify-between">
                    Cantidad Total <span>({waste.unidad.toUpperCase()})</span>
                  </Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={waste.valor} 
                    onChange={e => setWaste({...waste, valor: e.target.value})} 
                    className="h-24 text-6xl font-black text-center border-none bg-slate-50 dark:bg-zinc-950 rounded-2xl focus-visible:ring-1 focus-visible:ring-[#116CA2]" 
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </Card>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-[2] h-14 rounded-2xl bg-[#116CA2] hover:bg-[#0d5a8a] text-white shadow-lg shadow-blue-500/20 text-sm font-black uppercase tracking-[0.2em]" disabled={loading}>
              {loading ? 'Procesando...' : 'Finalizar Viaje'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function MobileRegistroPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Cargando formulario...</div>}>
      <RegistroForm />
    </Suspense>
  )
}