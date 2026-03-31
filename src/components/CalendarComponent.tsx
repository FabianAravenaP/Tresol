"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Info, Calendar as CalendarIcon, Clock, Truck, User, MapPin, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/uib/button"
import { Card, CardContent } from "@/components/uib/card"
import { Badge } from "@/components/uib/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/uib/dialog"

interface Service {
  id: string
  fecha: string
  origen: string
  destino: string
  carga: string
  estado: string
  usuarios?: { nombre: string }
  vehiculos?: { patente: string }
}

interface CalendarProps {
  services: Service[]
  onDateClick?: (date: Date) => void
}

export default function CalendarComponent({ services, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const generateDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const days = []
    
    // Day adjustment for Monday start (0 is Sunday)
    let firstDay = firstDayOfMonth(year, month) - 1
    if (firstDay === -1) firstDay = 6

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Days of current month
    const totalDays = daysInMonth(year, month)
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  const getServicesForDate = (date: Date) => {
    // Format to YYYY-MM-DD using local time to avoid UTC shifts
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    return services.filter(s => s.fecha === dateStr)
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setIsDialogOpen(true)
    if (onDateClick) onDateClick(date)
  }

  const calendarDays = generateDays()
  const today = new Date()
  today.setHours(0,0,0,0)

  return (
    <div className="w-full h-full flex flex-col space-y-6 p-8 font-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="bg-[#51872E]/10 p-3 rounded-2xl">
              <CalendarIcon className="size-6 text-[#51872E]" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-[#323232] capitalize">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-0.5">Gestión de Planificación</p>
           </div>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-2xl border border-muted/50">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl hover:bg-white hover:shadow-sm">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="rounded-xl font-black text-[10px] uppercase px-4 hover:bg-white hover:shadow-sm tracking-widest">
            Hoy
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl hover:bg-white hover:shadow-sm">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-none ring-1 ring-black/5 rounded-[2rem] overflow-hidden bg-white shadow-2xl flex-1 min-h-[600px]">
        {dayNames.map(day => (
          <div key={day} className="p-4 text-center text-[10px] font-black uppercase tracking-[0.3em] text-[#116CA2] border-b bg-[#f8fbff]">
            {day}
          </div>
        ))}
        
        {calendarDays.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="bg-zinc-50/50 border-b border-r border-muted/20 last:border-r-0" />
          
          const dayServices = getServicesForDate(date)
          const isToday = date.getTime() === today.getTime()
          const isSunday = date.getDay() === 0

          return (
            <div 
              key={date.toISOString()} 
              onClick={() => handleDayClick(date)}
              className={cn(
                "min-h-[120px] p-3 border-b border-r border-muted/20 last:border-r-0 cursor-pointer transition-all hover:bg-[#51872E]/5 group relative font-sans",
                isToday && "bg-[#51872E]/5",
                isSunday && "bg-zinc-50/80"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "text-sm font-black p-1 rounded-xl size-8 flex items-center justify-center transition-all",
                  isToday ? "bg-[#51872E] text-white shadow-lg shadow-[#51872E]/30 scale-110" : "group-hover:bg-[#116CA2] group-hover:text-white"
                )}>
                  {date.getDate()}
                </span>
                {dayServices.length > 0 && (
                  <span className="text-[10px] font-black bg-[#51872E] text-white px-2 py-0.5 rounded-lg animate-in fade-in zoom-in shadow-sm">
                    {dayServices.length}
                  </span>
                )}
              </div>
              
              <div className="space-y-1.5 overflow-hidden">
                {dayServices.slice(0, 3).map((s, idx) => (
                  <div 
                    key={s.id} 
                    className={cn(
                      "text-[9px] font-bold truncate px-2 py-1 rounded-lg border-none shadow-sm",
                      s.estado === 'completado' 
                        ? "bg-emerald-500 text-white" 
                        : "bg-[#116CA2] text-white"
                    )}
                  >
                    {Array.isArray(s.vehiculos) ? s.vehiculos[0]?.patente : s.vehiculos?.patente}
                  </div>
                ))}
                {dayServices.length > 3 && (
                  <div className="text-[9px] text-center text-[#116CA2] font-black pt-1 tracking-tighter">
                    + {dayServices.length - 3} SERVICIOS
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0 border-none rounded-[2rem] shadow-2xl flex flex-col font-heading">
          <div className="bg-[#116CA2] p-8 text-white">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                 <CalendarIcon className="size-6 text-blue-200" />
                 <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                    Programación Día
                 </DialogTitle>
              </div>
              <DialogDescription className="text-blue-100 font-bold opacity-80 text-lg">
                {selectedDate?.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#FFF9F0]/30 min-h-0">
            {selectedDate && getServicesForDate(selectedDate).length === 0 ? (
              <div className="text-center py-20 bg-white/50 rounded-[2rem] border-2 border-dashed border-muted">
                <Info className="size-16 mx-auto text-muted-foreground mb-4 opacity-10" />
                <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-sm">Sin servicios programados</p>
              </div>
            ) : (
              selectedDate && getServicesForDate(selectedDate).map((s) => (
                <Card key={s.id} className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all rounded-3xl bg-white group">
                  <div className="flex">
                    <div className={cn(
                        "w-2 transition-all",
                        s.estado === 'completado' ? "bg-emerald-500" : "bg-[#116CA2]"
                    )} />
                    <CardContent className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex items-center gap-3">
                             <div className="bg-zinc-100 p-2.5 rounded-2xl">
                                <User className="size-5 text-[#323232]" />
                             </div>
                             <div>
                                <h4 className="font-black text-lg text-[#323232] leading-none">
                                   {Array.isArray(s.usuarios) ? s.usuarios[0]?.nombre : s.usuarios?.nombre}
                                </h4>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Conductor Asignado</p>
                             </div>
                          </div>
                          <Badge className={cn(
                            "rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] border-none shadow-sm",
                            s.estado === 'completado' ? "bg-emerald-500 text-white" : "bg-[#51872E] text-white"
                          )}>
                            {s.estado}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                 <Truck className="size-4 text-[#116CA2] mt-0.5" />
                                 <div>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Equipo</p>
                                    <p className="font-bold text-sm tracking-tight">
                                       {Array.isArray(s.vehiculos) ? s.vehiculos[0]?.patente : s.vehiculos?.patente}
                                    </p>
                                 </div>
                              </div>
                              <div className="flex items-start gap-3">
                                 <Package className="size-4 text-[#51872E] mt-0.5" />
                                 <div>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Carga</p>
                                    <p className="font-bold text-sm tracking-tight">{s.carga}</p>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="bg-zinc-50 p-4 rounded-2xl space-y-3 relative">
                              <div className="flex items-start gap-3">
                                 <MapPin className="size-4 text-blue-500 mt-0.5" />
                                 <div>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Origen</p>
                                    <p className="font-bold text-xs">{s.origen}</p>
                                 </div>
                              </div>
                              <div className="flex items-start gap-3">
                                 <MapPin className="size-4 text-emerald-500 mt-0.5" />
                                 <div>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Destino</p>
                                    <p className="font-bold text-xs">{s.destino}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}