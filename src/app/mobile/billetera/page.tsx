"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Wallet, Calendar, MapPin, TrendingUp, History } from "lucide-react"
import { Badge } from "@/components/uib/badge"
import { NavigationHeader } from "@/components/NavigationHeader"

export default function BilleteraPage() {
  const router = useRouter()
  const [currentChofer, setCurrentChofer] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [totalGanado, setTotalGanado] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Read the centralized session
    const sessionStr = localStorage.getItem('tresol_session')
    if (sessionStr) {
      try {
        const user = JSON.parse(sessionStr)
        if (user.rol === 'chofer' || user.rol === 'admin' || user.rol === 'master_admin') {
          setCurrentChofer(user)
          if (user.rol === 'chofer') {
            fetchEarnings(user.id)
          } else {
            setIsLoading(false)
          }
        } else {
          router.push('/')
        }
      } catch (e) {
        router.push('/')
      }
    } else {
      router.push('/')
    }
  }, [])

  const fetchEarnings = async (choferId: string) => {
    setIsLoading(true)
    try {
      // 1. Fetch ALL completed services for this chofer
      const [servRes, bonusRes] = await Promise.all([
        fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'servicios_asignados', method: 'select', data: 'id, fecha, origen, destino, estado, bono_tipo_vehiculo', match: { chofer_id: choferId, estado: 'completado' } }) }),
        fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'bonos_produccion', method: 'select', data: '*' }) })
      ])
      const [servJson, bonusJson] = await Promise.all([servRes.json(), bonusRes.json()])
      const servicios = (servJson.data || []).sort((a: any, b: any) => (b.fecha || '').localeCompare(a.fecha || ''))
      if (servJson.error) throw new Error(servJson.error)

      if (servicios && servicios.length > 0) {
        // 2. Fetch ALL bonus mapping to calculate locally
        const bonosMapping = bonusJson.data

        // 3. Process each service to calculate its individual bonus
        const processedHistorial = servicios.map((s: any) => {
          let bonus = 0
          
          // Inference logic (Same as in mobile home page)
          let queryRegion = 'TRESOL VALDIVIA'
          const destinationUpper = s.destino?.toUpperCase() || ''
          const originUpper = s.origen?.toUpperCase() || ''
          
          if (destinationUpper.includes('OSORNO') || originUpper.includes('OSORNO')) {
             queryRegion = 'TRESOL OSORNO'
          } else if (destinationUpper.includes('MONTT') || originUpper.includes('MONTT') || destinationUpper.includes('MAULLIN')) {
             queryRegion = 'TRESOL PUERTO MONTT'
          }

          const vehicleTypeForBonus = s.bono_tipo_vehiculo || 'CAMION'
          
          const match = bonosMapping?.find((b: any) =>
            b.region === queryRegion && 
            b.tipo_vehiculo === vehicleTypeForBonus
          )

          if (match) {
            bonus = match.valor
          }

          return {
            ...s,
            bono_calculado: bonus
          }
        })

        setHistorial(processedHistorial)
        const total = processedHistorial.reduce((sum: number, item: any) => sum + item.bono_calculado, 0)
        setTotalGanado(total)
      }
    } catch (error) {
      console.error("Error fetching earnings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0] dark:bg-zinc-950">
      <NavigationHeader 
        title="Mi Billetera" 
        subtitle="Control de Producción" 
        showBack={true} 
      />

      <main className="p-4 pb-20 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        {/* Total Earnings Card */}
        <Card className="bg-[#116CA2] text-white shadow-xl border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Wallet className="size-32 rotate-12" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="text-blue-100/70 font-medium">Ganancias Totales Acumuladas</CardDescription>
            <CardTitle className="text-4xl font-black tracking-tight">
               ${new Intl.NumberFormat('es-CL').format(totalGanado)}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
             <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-full border border-white/20">
                <TrendingUp className="size-3.5" />
                <span>{historial.length} servicios completados</span>
             </div>
          </CardContent>
        </Card>

        {/* History List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#116CA2] dark:text-blue-400 px-1">
             <History className="size-4" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Historial de Servicios</span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : historial.length === 0 ? (
            <Card className="border-dashed rounded-2xl">
              <CardContent className="py-10 text-center text-muted-foreground">
                 <p>Aún no tienes servicios completados registrados.</p>
                 <p className="text-xs">Tus ganancias aparecerán aquí cuando finalices un viaje.</p>
              </CardContent>
            </Card>
          ) : (
            historial.map((item) => (
              <Card key={item.id} className="shadow-sm border-slate-100 dark:border-zinc-800 hover:border-[#116CA2]/20 transition-all overflow-hidden group rounded-2xl">
                 <div className="h-1 w-full bg-emerald-500/10 group-hover:bg-emerald-500/20" />
                 <CardContent className="p-4 flex justify-between items-center">
                    <div className="space-y-2 flex-1">
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase">
                          <Calendar className="size-3 text-[#116CA2]" />
                          {new Date(item.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                             <div className="flex items-center gap-2">
                                <MapPin className="size-3 text-zinc-400" />
                                <span className="font-bold text-sm line-clamp-1">{item.origen} → {item.destino}</span>
                             </div>
                             <Badge variant="outline" className="w-fit text-[9px] mt-1.5 uppercase border-[#116CA2]/10 text-[#116CA2] bg-[#116CA2]/5 font-black">
                                {item.bono_tipo_vehiculo || 'CAMION'}
                             </Badge>
                          </div>
                       </div>
                    </div>
                    <div className="text-right pl-4">
                       <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          +${new Intl.NumberFormat('es-CL').format(item.bono_calculado)}
                       </div>
                       <div className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">Bono Generado</div>
                    </div>
                 </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="text-center pt-8">
           <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black opacity-40 leading-relaxed">
              Los montos están sujetos a validación administrativa<br/>y pueden variar según condiciones de ruta
           </p>
        </div>
      </main>
    </div>
  )
}