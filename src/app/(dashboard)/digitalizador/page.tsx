"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/uib/card"
import { Button } from "@/components/uib/button"
import { Input } from "@/components/uib/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/uib/table"
import { Badge } from "@/components/uib/badge"
import { Search, Download, FileSpreadsheet, RefreshCcw, FileText, CheckCircle2, Truck, LogOut } from "lucide-react"
import { NavigationHeader } from "@/components/NavigationHeader"

export default function DigitalizadorPage() {
  const [comprobantes, setComprobantes] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchComprobantes()
  }, [])

  useEffect(() => {
    const term = searchTerm.toLowerCase()
    const results = comprobantes.filter(c => 
      c.folio?.toLowerCase().includes(term) ||
      c.empresa?.toLowerCase().includes(term) ||
      c.nombre_conductor?.toLowerCase().includes(term) ||
      c.patente?.toLowerCase().includes(term)
    )
    setFiltered(results)
  }, [searchTerm, comprobantes])

  const fetchComprobantes = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/logger')
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)
      setComprobantes(data.comprobantes || [])
      setFiltered(data.comprobantes || [])
    } catch (error) {
      console.error("Error fetching comprobantes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportAllToCSV = () => {
    if (filtered.length === 0) return

    const headers = [
      'Folio', 'Fecha', 'Empresa', 'Planta', 'Patente', 'Chofer', 
      'Categoria', 'Cantidad', 'Unidad', 'Destino', 'Contenedor', 'Salida', 'Observaciones'
    ]

    const csvRows = filtered.map(c => {
      let cat = 'Asimilables'
      let amount = c.cat_asimilables_m3 || c.cat_asimilables_kilos || 0
      let unit = c.cat_asimilables_m3 ? 'M3' : 'KG'

      if (c.cat_lodos_m3 || c.cat_lodos_kilos) { cat = 'Lodos'; amount = c.cat_lodos_m3 || c.cat_lodos_kilos; unit = c.cat_lodos_m3 ? 'M3' : 'KG' }
      else if (c.cat_escombros_m3 || c.cat_escombros_kilos) { cat = 'Escombros'; amount = c.cat_escombros_m3 || c.cat_escombros_kilos; unit = c.cat_escombros_m3 ? 'M3' : 'KG' }
      else if (c.cat_peligrosos_m3 || c.cat_peligrosos_kilos) { cat = 'Peligrosos'; amount = c.cat_peligrosos_m3 || c.cat_peligrosos_kilos; unit = c.cat_peligrosos_m3 ? 'M3' : 'KG' }

      const safe = (v: any) => String(v || '').replace(/;/g, ',').replace(/\n/g, ' ').trim()

      return [
        safe(c.folio), safe(c.fecha), safe(c.empresa), safe(c.planta_lugar), 
        safe(c.patente), safe(c.nombre_conductor), safe(cat), safe(amount), 
        safe(unit), safe(c.destino_tipo), safe(c.contenedor_tipo), 
        safe(c.salida_pm), safe(c.observaciones)
      ].join(';')
    })

    const csvContent = '\uFEFF' + headers.join(';') + '\r\n' + csvRows.join('\r\n')
    downloadFile(csvContent, `reporte_general_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const exportIndividual = (c: any) => {
    const headers = ['Campo', 'Valor']
    const safe = (v: any) => String(v || '').replace(/;/g, ',').replace(/\n/g, ' ').trim()
    
    const rows = [
      ['Folio', safe(c.folio)],
      ['Fecha', safe(c.fecha)],
      ['Empresa', safe(c.empresa)],
      ['Planta', safe(c.planta_lugar)],
      ['Patente', safe(c.patente)],
      ['Chofer', safe(c.nombre_conductor)],
      ['Contenedor', safe(c.contenedor_tipo)],
      ['Destino', safe(c.destino_tipo)],
      ['Salida', safe(c.salida_pm)],
      ['Observaciones', safe(c.observaciones)]
    ]

    const csvContent = '\uFEFF' + headers.join(';') + '\r\n' + rows.map(r => r.join(';')).join('\r\n')
    downloadFile(csvContent, `comprobante_${c.folio}.csv`)
  }

  const downloadFile = (content: string, filename: string) => {
    const form = document.createElement("form");
    form.action = "/api/download-echo";
    form.method = "POST";
    form.target = "_self"; 

    const inputContent = document.createElement("input");
    inputContent.type = "hidden";
    inputContent.name = "content";
    inputContent.value = content;

    const inputFilename = document.createElement("input");
    inputFilename.type = "hidden";
    inputFilename.name = "filename";
    inputFilename.value = filename;

    form.appendChild(inputContent);
    form.appendChild(inputFilename);
    document.body.appendChild(form);
    
    form.submit();
    document.body.removeChild(form);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950">
      <NavigationHeader title="Repositorio Digital" subtitle="Central de Inteligencia Tresol" />

      <main className="p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-[#323232] dark:text-white uppercase italic">Vista General</h2>
            <p className="text-muted-foreground font-medium">Gestión de Residuos & Certificaciones</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={fetchComprobantes} disabled={isLoading} className="rounded-xl border-border/60 font-bold h-12">
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button className="bg-[#51872E] hover:bg-[#406B24] text-white rounded-xl font-bold h-12 shadow-lg shadow-[#51872E]/20" onClick={exportAllToCSV} disabled={isLoading || filtered.length === 0}>
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Exportar Consolidado
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#51872E]/5 border-none rounded-2xl p-6">
             <div className="flex items-center gap-4">
                <div className="bg-[#51872E] p-3 rounded-xl text-white shadow-md">
                   <CheckCircle2 className="size-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-[#51872E] tracking-widest">Total Registrados</p>
                   <p className="text-2xl font-black text-[#323232]">{comprobantes.length}</p>
                </div>
             </div>
          </Card>
          <Card className="bg-[#116CA2]/5 border-none rounded-2xl p-6">
             <div className="flex items-center gap-4">
                <div className="bg-[#116CA2] p-3 rounded-xl text-white shadow-md">
                   <Download className="size-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-[#116CA2] tracking-widest">Listos para Exportar</p>
                   <p className="text-2xl font-black text-[#323232]">{filtered.length}</p>
                </div>
             </div>
          </Card>
          <Card className="bg-[#FBC15F]/10 border-none rounded-2xl p-6">
             <div className="flex items-center gap-4">
                <div className="bg-[#FBC15F] p-3 rounded-xl text-[#323232] shadow-md">
                   <FileText className="size-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-[#8B6E30] tracking-widest">Certificaciones v2.0</p>
                   <p className="text-2xl font-black text-[#323232]">Activa</p>
                </div>
             </div>
          </Card>
      </div>

      <Card className="shadow-2xl border-none ring-1 ring-black/5 rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-md">
        <CardHeader className="pb-6 pt-8 px-8 border-b border-muted/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="space-y-1">
                <CardTitle className="text-2xl font-black tracking-tight">Comprobantes de Servicio</CardTitle>
                <CardDescription className="font-medium">Gestión documental de ruta y disposición segura.</CardDescription>
             </div>
             <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por folio, cliente o chofer..." 
                  className="pl-12 h-12 bg-zinc-50 border-none rounded-2xl shadow-inner focus:ring-2 focus:ring-[#51872E]/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                  <TableHead className="w-32 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Folio</TableHead>
                  <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha Emisión</TableHead>
                  <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliente / Sucursal</TableHead>
                  <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vehículo / Operador</TableHead>
                  <TableHead className="text-right px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-b border-muted/20">
                      <TableCell colSpan={5} className="h-20 bg-muted/5"></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground font-medium italic">
                      No se encontraron servicios digitalizados en la base de datos central.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className="group hover:bg-[#51872E]/5 transition-all border-b border-muted/20">
                        <TableCell className="px-8 py-5">
                         <Badge variant="outline" className="font-black text-sm px-3 py-1 bg-white dark:bg-zinc-800 border-[#116CA2]/30 text-[#116CA2] rounded-lg shadow-sm">
                           {c.folio || "S/N"}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-bold text-[#323232]">
                        {c.fecha || "Sin fecha"}
                      </TableCell>
                      <TableCell className="py-5">
                         <div className="font-black text-[#51872E] text-base leading-none mb-1">{c.empresa}</div>
                         <div className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">{c.planta_lugar}</div>
                      </TableCell>
                      <TableCell className="py-5">
                         <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-300 text-xs mb-1">
                            <Truck className="size-3" />
                            {c.patente}
                         </div>
                         <div className="text-xs font-bold text-muted-foreground/80 italic">{c.nombre_conductor}</div>
                      </TableCell>
                      <TableCell className="text-right px-8 py-5">
                         <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-[#116CA2] border-[#116CA2]/30 hover:bg-[#116CA2] hover:text-white rounded-xl font-bold transition-all shadow-sm group-hover:shadow-md h-10 px-4"
                            onClick={() => exportIndividual(c)} 
                         >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center border-t border-muted/30 pt-8 pb-12">
          <div className="flex flex-col items-center gap-2">
            <img 
               src="https://tresol.cl/es/wp-content/uploads/2025/05/Recurso-5Logo-oficial-de-tresol.svg" 
               alt="Tresol Logo Footer" 
               className="h-8 w-auto grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair"
            />
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Gestión Sustentable de Residuos</p>
            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-1">Platform by Fabian Aravena | Ing. Civil Industrial</p>
          </div>
      </div>
      </main>
    </div>
  )
}