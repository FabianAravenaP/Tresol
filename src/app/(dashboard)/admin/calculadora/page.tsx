"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/uib/card"
import { Input } from "@/components/uib/input"
import { Button } from "@/components/uib/button"
import { Badge } from "@/components/uib/badge"
import { Calculator, TrendingUp, TrendingDown, Info, AlertTriangle } from 'lucide-react'
import { toast } from "sonner"

export default function CalculadoraReajuste() {
  const [precioBase, setPrecioBase] = useState<number>(0)
  
  // Índices Base
  const [ipcBase, setIpcBase] = useState<number>(100)
  const [moBase, setMoBase] = useState<number>(100)
  const [dieselBase, setDieselBase] = useState<number>(1000)
  const [usdBase, setUsdBase] = useState<number>(850)

  // Índices Actuales
  const [ipcActual, setIpcActual] = useState<number>(107.68)
  const [moActual, setMoActual] = useState<number>(110.5)
  const [dieselActual, setDieselActual] = useState<number>(1580)
  const [usdActual, setUsdActual] = useState<number>(930)

  // Ponderaciones
  const [alpha, setAlpha] = useState<number>(0.10) // IPC
  const [beta, setBeta] = useState<number>(0.35)  // MO
  const [gamma, setGamma] = useState<number>(0.30) // Diesel
  const [delta, setDelta] = useState<number>(0.15) // USD
  const [epsilon, setEpsilon] = useState<number>(0.10) // Fijo

  const [resultado, setResultado] = useState<{
    nuevoPrecio: number
    factor: number
    variacion: number
  } | null>(null)

  const handleCalcular = () => {
    const sumaPonderaciones = alpha + beta + gamma + delta + epsilon
    if (Math.abs(sumaPonderaciones - 1.0) > 0.001) {
      toast.error(`Las ponderaciones deben sumar 1.00 (Actual: ${sumaPonderaciones.toFixed(3)})`)
      return
    }

    const fIPC = alpha * (ipcActual / ipcBase)
    const fMO = beta * (moActual / moBase)
    const fDiesel = gamma * (dieselActual / dieselBase)
    const fUSD = delta * (usdActual / usdBase)
    
    const factorTotal = fIPC + fMO + fDiesel + fUSD + epsilon
    const nuevoPrecio = precioBase * factorTotal
    const variacion = (factorTotal - 1) * 100

    setResultado({
      nuevoPrecio,
      factor: factorTotal,
      variacion
    })
    
    toast.success("Cálculo realizado con éxito")
  }

  const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#323232] flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-[#51872E]/10 rounded-xl">
                <Calculator className="size-8 text-[#51872E]" />
            </div>
            Calculadora de Reajuste
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Herramienta de Control de Gestión por Reajuste Polinómico</p>
        </div>
        <Badge variant="outline" className="bg-[#116CA2]/10 text-[#116CA2] border-[#116CA2]/20 font-black px-4 py-1.5 rounded-lg uppercase tracking-widest text-[10px]">
           Versión 2.0 Modular
        </Badge>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/50 backdrop-blur-xl ring-1 ring-black/5">
        <CardContent className="p-8 md:p-12 space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Precio Base del Servicio ($)</label>
            <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-[#51872E]">$</span>
                <Input 
                    type="number" 
                    value={precioBase || ''} 
                    onChange={(e) => setPrecioBase(Number(e.target.value))}
                    className="h-20 pl-12 bg-white border-2 border-slate-100 rounded-[2rem] text-3xl font-black text-[#323232] transition-all focus:ring-4 focus:ring-[#51872E]/10"
                    placeholder="0"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-2xl w-fit">
                    <Info className="size-4 text-slate-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Índices Mes Base</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <IdxField label="IPC Base" value={ipcBase} setter={setIpcBase} />
                    <IdxField label="Mano de Obra (MO)" value={moBase} setter={setMoBase} />
                    <IdxField label="Diésel Base ($)" value={dieselBase} setter={setDieselBase} />
                    <IdxField label="Dólar (USD) Base ($)" value={usdBase} setter={setUsdBase} />
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#116CA2]/10 rounded-2xl w-fit">
                    <TrendingUp className="size-4 text-[#116CA2]" />
                    <span className="text-xs font-black uppercase tracking-widest text-[#116CA2]">Índices Mes Actual</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <IdxField label="IPC Actual" value={ipcActual} setter={setIpcActual} />
                    <IdxField label="Mano de Obra (MO)" value={moActual} setter={setMoActual} />
                    <IdxField label="Diésel Actual ($)" value={dieselActual} setter={setDieselActual} />
                    <IdxField label="Dólar Actual ($)" value={usdActual} setter={setUsdActual} />
                </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 space-y-6">
               <div className="flex items-center gap-2 px-4 py-2 bg-[#FBC15F]/10 rounded-2xl w-fit text-[#FBC15F]">
                    <AlertTriangle className="size-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Ponderaciones de Polinomio</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <WeightField label="IPC (α)" value={alpha} setter={setAlpha} />
                    <WeightField label="MO (β)" value={beta} setter={setBeta} />
                    <WeightField label="Diésel (γ)" value={gamma} setter={setGamma} />
                    <WeightField label="USD (δ)" value={delta} setter={setDelta} />
                    <WeightField label="Fijo (ε)" value={epsilon} setter={setEpsilon} />
                </div>
          </div>

          <Button 
            onClick={handleCalcular}
            className="w-full h-16 bg-[#51872E] hover:bg-[#406B24] text-white rounded-[2rem] text-xl font-black shadow-xl shadow-[#51872E]/30 transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            CALCULAR REAJUSTE TARIFARIO
          </Button>

          {resultado && (
            <div className="mt-8 p-10 rounded-[2.5rem] bg-[#116CA2]/5 border-2 border-[#116CA2]/10 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black text-[#116CA2] uppercase tracking-[0.4em]">Resultado del Cálculo</p>
                    <h3 className="text-5xl font-black text-[#116CA2]">{formatoCLP.format(resultado.nuevoPrecio)}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#116CA2]/10 mt-6">
                    <div className="text-center space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Factor Polinómico</p>
                        <p className="text-2xl font-black text-[#323232]">{resultado.factor.toFixed(4)}</p>
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variación Tarifaria</p>
                        <p className={`text-2xl font-black ${resultado.variacion >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {resultado.variacion >= 0 ? <TrendingUp className="inline mr-1 size-5" /> : <TrendingDown className="inline mr-1 size-5" />}
                            {Math.abs(resultado.variacion).toFixed(2)}%
                        </p>
                    </div>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex flex-col items-center gap-2 opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Propiedad Intelectual de Tresol Chile</p>
          <p className="text-[8px] font-bold uppercase tracking-[0.2em]">Desarrollado para Control de Gestión Operativa</p>
      </div>
    </div>
  )
}

function IdxField({ label, value, setter }: { label: string, value: number, setter: (v: number) => void }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <Input 
                type="number" 
                value={value} 
                onChange={(e) => setter(Number(e.target.value))}
                className="h-12 bg-white border border-slate-200 rounded-xl font-bold transition-all focus:ring-2 focus:ring-[#116CA2]/10"
            />
        </div>
    )
}

function WeightField({ label, value, setter }: { label: string, value: number, setter: (v: number) => void }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <Input 
                type="number" 
                step="0.01"
                min="0"
                max="1"
                value={value} 
                onChange={(e) => setter(Number(e.target.value))}
                className="h-12 bg-white border-2 border-[#FBC15F]/20 rounded-xl font-bold text-center transition-all focus:ring-2 focus:ring-[#FBC15F]/10"
            />
        </div>
    )
}
