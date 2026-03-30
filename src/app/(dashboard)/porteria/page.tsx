"use client"

import React, { useState, useEffect } from "react"
import { 
  Shield, 
  Search, 
  LogIn, 
  LogOut, 
  UserPlus, 
  Building2, 
  Truck, 
  History,
  Clock,
  ArrowRight,
  Loader2,
  ChevronRight,
  Calendar,
  MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { NavigationHeader } from "@/components/NavigationHeader"
import { cn } from "@/lib/utils"

export default function PorteriaPage() {
  const [activePorteria, setActivePorteria] = useState<'husamontt' | 'tresol_antiguo'>('husamontt')
  const [searchTerm, setSearchTerm] = useState("")
  const [maestro, setMaestro] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  // Registration modal state for externals (simplified as inline form for now)
  const [showExternalForm, setShowExternalForm] = useState(false)
  const [externalData, setExternalData] = useState({
    nombre: '',
    empresa: '',
    patente: '',
    observacion: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [maestroRes, logsRes] = await Promise.all([
        fetch('/api/proxy', {
          method: 'POST',
          body: JSON.stringify({ table: 'maestro_personas', method: 'select' })
        }),
        fetch('/api/proxy', {
          method: 'POST',
          body: JSON.stringify({ 
            table: 'logs_porteria', 
            method: 'select',
            data: '*, persona:maestro_personas(nombre, apellido)'
          })
        })
      ])

      const maestroData = await maestroRes.json()
      const logsData = await logsRes.json()

      setMaestro(maestroData.data || [])
      setLogs(logsData.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterEntry = async (persona: any) => {
    setIsProcessing(`entry-${persona.id}`)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        body: JSON.stringify({
          table: 'logs_porteria',
          method: 'insert',
          data: {
            persona_id: persona.id,
            empresa: persona.empresa,
            patente: persona.patente_default,
            porteria: activePorteria,
            hora_ingreso: new Date().toISOString()
          }
        })
      })
      if (res.ok) {
        fetchData()
        setSearchTerm("")
      }
    } catch (error) {
      console.error("Error registering entry:", error)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleRegisterExit = async (logId: string) => {
    setIsProcessing(`exit-${logId}`)
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        body: JSON.stringify({
          table: 'logs_porteria',
          method: 'update',
          match: { id: logId },
          data: {
            hora_salida: new Date().toISOString()
          }
        })
      })
      if (res.ok) fetchData()
    } catch (error) {
      console.error("Error registering exit:", error)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleExternalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing('external')
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        body: JSON.stringify({
          table: 'logs_porteria',
          method: 'insert',
          data: {
            nombre_manual: externalData.nombre,
            empresa: externalData.empresa,
            patente: externalData.patente,
            observacion: externalData.observacion,
            porteria: activePorteria,
            hora_ingreso: new Date().toISOString()
          }
        })
      })
      if (res.ok) {
        setExternalData({ nombre: '', empresa: '', patente: '', observacion: '' })
        setShowExternalForm(false)
        fetchData()
      }
    } catch (error) {
      console.error("Error registering external:", error)
    } finally {
      setIsProcessing(null)
    }
  }

  const filteredMaestro = maestro.filter(p => 
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.rut?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 6)

  const activeEntries = logs.filter(l => !l.hora_salida && l.porteria === activePorteria)
  const recentExits = logs.filter(l => l.hora_salida && l.porteria === activePorteria).slice(0, 5)

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950 font-sans selection:bg-[#51872E] selection:text-white">
      <NavigationHeader 
        title="Control Portería" 
        subtitle={activePorteria === 'husamontt' ? "Sede Husamontt" : "Sede Tresol Antiguo"}
      />

      {/* Porteria Selection (Now below header) */}
      <div className="fixed top-20 w-full z-40 bg-zinc-50/80 backdrop-blur-sm border-b border-slate-100 h-14 flex items-center justify-center px-10">
           <div className="flex items-center bg-slate-200/50 p-1 rounded-xl">
              <button 
                onClick={() => setActivePorteria('husamontt')}
                className={cn(
                  "px-6 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest",
                  activePorteria === 'husamontt' ? "bg-white text-[#116CA2] shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Husamontt
              </button>
              <button 
                onClick={() => setActivePorteria('tresol_antiguo')}
                className={cn(
                  "px-6 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest",
                  activePorteria === 'tresol_antiguo' ? "bg-white text-[#116CA2] shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Tresol Antiguo
              </button>
           </div>
      </div>

      <main className="pt-40 pb-20 px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Search & Quick Access */}
          <div className="lg:col-span-7 space-y-8">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
               <CardContent className="p-10 space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-[#323232]">Registrar Ingreso</h2>
                    <p className="text-sm text-slate-500 font-medium font-sans">Busca un trabajador o ingresa una visita externa.</p>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-slate-400" />
                    <Input 
                      placeholder="Busca por Nombre, Apellido o RUT..."
                      className="h-16 pl-14 pr-6 bg-slate-50 border-none rounded-2xl text-lg font-bold placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-[#116CA2]/50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {searchTerm.length > 0 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                       {filteredMaestro.map(person => (
                         <div key={person.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                            <div className="flex items-center gap-4">
                               <div className="size-12 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm group-hover:bg-[#116CA2] group-hover:text-white transition-colors">
                                  <Truck className="size-6" />
                               </div>
                               <div>
                                  <p className="font-black text-[#323232]">{person.nombre} {person.apellido}</p>
                                  <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{person.empresa}</span>
                                     <span className="text-slate-200">•</span>
                                     <span className="text-[10px] font-bold text-[#116CA2] uppercase tracking-widest">{person.patente_default || 'S/P'}</span>
                                  </div>
                               </div>
                            </div>
                            <Button 
                              className="bg-[#51872E] hover:bg-[#437126] text-white rounded-xl font-black px-6 h-10 shadow-lg shadow-[#51872E]/20"
                              onClick={() => handleRegisterEntry(person)}
                              disabled={!!isProcessing}
                            >
                               {isProcessing === `entry-${person.id}` ? <Loader2 className="animate-spin size-4" /> : 'INGRESAR'}
                            </Button>
                         </div>
                       ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                     <p className="text-xs font-bold text-slate-400 italic">¿Nuevo trabajador o visita externa?</p>
                     <Button 
                      variant="outline" 
                      className="rounded-xl font-black border-slate-200 text-[#116CA2] hover:bg-[#116CA2]/5 px-6"
                      onClick={() => setShowExternalForm(!showExternalForm)}
                     >
                       <UserPlus className="mr-2 size-4" />
                       REGISTRO EXTERNO
                     </Button>
                  </div>

                  {showExternalForm && (
                     <form onSubmit={handleExternalSubmit} className="space-y-4 p-6 bg-[#116CA2]/5 rounded-3xl animate-in zoom-in fade-in duration-300">
                        <div className="grid grid-cols-2 gap-4">
                           <Input 
                            placeholder="Nombre completo" 
                            className="bg-white border-none rounded-xl h-12 px-4 font-bold"
                            value={externalData.nombre}
                            onChange={(e) => setExternalData({...externalData, nombre: e.target.value})}
                            required
                           />
                           <Input 
                            placeholder="Empresa" 
                            className="bg-white border-none rounded-xl h-12 px-4 font-bold"
                            value={externalData.empresa}
                            onChange={(e) => setExternalData({...externalData, empresa: e.target.value})}
                            required
                           />
                           <Input 
                            placeholder="Patente" 
                            className="bg-white border-none rounded-xl h-12 px-4 font-bold"
                            value={externalData.patente}
                            onChange={(e) => setExternalData({...externalData, patente: e.target.value})}
                           />
                           <Input 
                            placeholder="Observación" 
                            className="bg-white border-none rounded-xl h-12 px-4 font-bold"
                            value={externalData.observacion}
                            onChange={(e) => setExternalData({...externalData, observacion: e.target.value})}
                           />
                        </div>
                        <Button className="w-full bg-[#116CA2] hover:bg-[#0d5985] rounded-xl h-12 font-black shadow-lg shadow-[#116CA2]/20" type="submit">
                           {isProcessing === 'external' ? <Loader2 className="animate-spin size-5" /> : 'REGISTRAR VISITA'}
                        </Button>
                     </form>
                  )}
               </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="border-none shadow-lg shadow-slate-200/40 rounded-[2rem] bg-white p-8 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="size-10 rounded-xl bg-[#51872E]/10 flex items-center justify-center">
                        <Building2 className="size-5 text-[#51872E]" />
                     </div>
                     <h3 className="font-black text-[#323232] uppercase tracking-tight">Personal en Planta</h3>
                  </div>
                  <div className="flex items-end gap-2">
                     <span className="text-4xl font-black text-[#51872E]">{activeEntries.length}</span>
                     <span className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-widest">personas</span>
                  </div>
               </Card>

               <Card className="border-none shadow-lg shadow-slate-200/40 rounded-[2rem] bg-white p-8 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="size-10 rounded-xl bg-[#FBC15F]/10 flex items-center justify-center">
                        <History className="size-5 text-[#FBC15F]" />
                     </div>
                     <h3 className="font-black text-[#323232] uppercase tracking-tight">Turno Actual</h3>
                  </div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                    {activePorteria === 'husamontt' ? 'Sede Husamontt' : 'Sede Tresol Antiguo'}
                  </div>
               </Card>
            </div>
          </div>

          {/* Right Column: Active Status & Logs */}
          <div className="lg:col-span-5 space-y-8">
             <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-[#323232] text-white overflow-hidden">
                <CardHeader className="p-8 pb-4">
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-xl font-black uppercase tracking-tight">Personal Adentro</CardTitle>
                     <Badge className="bg-[#51872E] h-6 px-3">{activeEntries.length} ACTIVOS</Badge>
                   </div>
                   <CardDescription className="text-slate-400 font-bold">Registro de personas que no han marcado salida.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-3 max-h-[500px] overflow-y-auto scrollbar-hide">
                   {activeEntries.length === 0 ? (
                     <div className="py-10 text-center space-y-3 px-10">
                        <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                           <Clock className="size-8 text-slate-500" />
                        </div>
                        <p className="text-slate-400 font-bold font-sans italic">Planta vacía. No hay registros de ingreso pendientes de salida.</p>
                     </div>
                   ) : (
                     activeEntries.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                           <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
                                 <Truck className="size-5 text-slate-300" />
                              </div>
                              <div>
                                 <p className="font-black text-sm">
                                    {log.persona ? `${log.persona.nombre} ${log.persona.apellido}` : log.nombre_manual}
                                 </p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    ING: {new Date(log.hora_ingreso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.patente || 'S/P'}
                                 </p>
                              </div>
                           </div>
                           <Button 
                            variant="destructive" 
                            className="rounded-xl font-black h-10 px-4 group/btn"
                            onClick={() => handleRegisterExit(log.id)}
                            disabled={!!isProcessing}
                           >
                              {isProcessing === `exit-${log.id}` ? <Loader2 className="animate-spin size-4" /> : 'SALIDA'}
                              {!isProcessing && <LogOut className="ml-2 size-4 transition-transform group-hover/btn:translate-x-1" />}
                           </Button>
                        </div>
                     ))
                   )}
                </CardContent>
             </Card>

             <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="p-8 pb-4">
                   <CardTitle className="text-xl font-black text-[#323232] uppercase tracking-tight">Salidas Recientes</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-3">
                   {recentExits.map(log => (
                      <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 opacity-70">
                         <div className="flex items-center gap-3">
                            <Clock className="size-4 text-slate-400" />
                            <div>
                               <p className="font-bold text-xs text-[#323232]">
                                 {log.persona ? `${log.persona.nombre} ${log.persona.apellido}` : log.nombre_manual}
                               </p>
                               <p className="text-[9px] font-bold text-slate-400">{log.empresa} • SALIDA: {new Date(log.hora_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                         </div>
                         <Badge variant="ghost" className="text-[9px] font-black">{log.patente || 'S/P'}</Badge>
                      </div>
                   ))}
                </CardContent>
             </Card>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="fixed bottom-0 w-full py-4 px-10 border-t border-slate-100 bg-white/80 backdrop-blur-md flex justify-between items-center z-50">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Solution by Fabian Aravena | Ing. Civil Industrial</p>
         <p className="text-[10px] font-black text-[#116CA2] uppercase tracking-widest opacity-40 italic">Tresol Logistics Management System</p>
      </footer>
    </div>
  )
}
