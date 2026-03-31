import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface CalendarMinimalistProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  serviceDays: string[] // Array of ISO strings "YYYY-MM-DD"
  className?: string
}

export function CalendarMinimalist({ selectedDate, onDateSelect, serviceDays, className }: CalendarMinimalistProps) {
  const [days, setDays] = useState<Date[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Generate next 30 days
    const nextDays = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < 30; i++) {
      const day = new Date(today)
      day.setDate(today.getDate() + i)
      nextDays.push(day)
    }
    setDays(nextDays)
  }, [])

  // Auto-scroll to selected date
  useEffect(() => {
    if (scrollRef.current && days.length > 0) {
      const selectedIdx = days.findIndex(d => isSameDay(d, selectedDate))
      if (selectedIdx !== -1) {
        const container = scrollRef.current
        const elements = container.children
        if (elements[selectedIdx]) {
          const target = elements[selectedIdx] as HTMLElement
          const scrollLeft = target.offsetLeft - (container.offsetWidth / 2) + (target.offsetWidth / 2)
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
        }
      }
    }
  }, [selectedDate, days])

  const hasService = (date: Date) => {
    const d = new Date(date)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    const dateStr = d.toISOString().split('T')[0]
    return serviceDays.includes(dateStr)
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate()
  }

  const getDayName = (date: Date) => {
    const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    return names[date.getDay()]
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary dark:text-blue-400 opacity-80 italic">Agenda de Operaciones</h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scroll-smooth no-scrollbar px-2 flex-nowrap select-none"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate)
          const isToday = isSameDay(day, new Date())
          const activeService = hasService(day)
          
          return (
            <motion.button
              key={day.toISOString()}
              whileTap={{ scale: 0.92 }}
              onClick={() => onDateSelect(day)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[65px] h-20 rounded-[1.5rem] transition-all snap-center relative border shadow-sm shrink-0",
                isSelected 
                  ? "bg-secondary text-white border-secondary shadow-xl shadow-secondary/20 z-10" 
                  : "bg-white dark:bg-zinc-900 text-slate-500 border-black/5 dark:border-white/5 hover:border-black/10"
              )}
            >
              <div className="flex flex-col items-center justify-center -space-y-0.5">
                <span className={cn(
                  "text-[9px] uppercase font-black tracking-[0.2em] mb-1 opacity-70",
                  isSelected ? "text-blue-100" : "text-muted-foreground"
                )}>
                  {getDayName(day)}
                </span>
                <span className="text-xl font-black leading-none tracking-tighter italic">
                  {day.getDate()}
                </span>
              </div>
              
              <AnimatePresence>
                {activeService && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "absolute bottom-2.5 size-1.5 rounded-full shadow-sm",
                      isSelected ? "bg-white" : "bg-emerald-500 shadow-emerald-500/30"
                    )} 
                  />
                )}
              </AnimatePresence>
              
              {isToday && !isSelected && (
                <div className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-red-500/80" />
              )}
            </motion.button>
          )
        })}
        <div className="min-w-[40px] h-1 shrink-0" />
      </div>
    </div>
  )
}
