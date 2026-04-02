"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/uib/button"
import { Card, CardContent } from "@/components/uib/card"
import { 
  Truck, 
  ShieldCheck, 
  FileText, 
  ChevronRight, 
  LayoutDashboard, 
  Smartphone, 
  ClipboardCheck,
  Search,
  User,
  Key,
  Shield,
  ArrowRight,
  TrendingDown,
  Target,
  Zap,
  Package,
  ChefHat
} from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/uib/dialog"
import { Input } from "@/components/uib/input"
import { Badge } from "@/components/uib/badge"

export const dynamic = 'force-dynamic'

export default function Home() {
  const router = useRouter()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchUsuarios = async () => {
    setIsLoading(true)
    try {
      const [resUsers, resPersonas] = await Promise.all([
        fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'usuarios',
            method: 'select',
            data: 'id, nombre, rol, password, rut'
          })
        }),
        fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'maestro_personas',
            method: 'select',
            data: 'rut, cargo'
          })
        })
      ])

      if (!resUsers.ok || !resPersonas.ok) {
        throw new Error('Error al cargar datos desde el proxy')
      }

      const { data: usersData, error: usersErr } = await resUsers.json()
      if (usersErr) throw new Error(usersErr)
      
      const { data: personasData, error: personasErr } = await resPersonas.json()
      if (personasErr) throw new Error(personasErr)

      const cargoMap = (personasData || []).reduce((acc: any, p: any) => {
        if (p.rut) acc[p.rut] = p.cargo || ''
        return acc
      }, {})

      const usersWithCargo = (usersData || []).map((u: any) => ({
        ...u,
        displayCargo: cargoMap[u.rut] || u.rol // fallback
      }))

      setUsuarios(usersWithCargo)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("No se pudo cargar el directorio de usuarios. Revisa tu conexión.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isLoginOpen) {
      fetchUsuarios()
    }
  }, [isLoginOpen])

  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState(false)

  const handleLogin = (user: any) => {
    // Check if user requires password
    const requiresPassword = ['master_admin', 'admin', 'admin_operaciones', 'usuario', 'operaciones'].includes(user.rol)
    
    if (requiresPassword && !selectedUser) {
      setSelectedUser(user)
      setPasswordInput("")
      setPasswordError(false)
      return
    }

    if (requiresPassword) {
      if (passwordInput === user.password) {
        // Success
      } else {
        setPasswordError(true)
        return
      }
    }

    // Save user to session/localStorage for simulation
    localStorage.setItem('tresol_session', JSON.stringify(user))
    
    // Redirect based on native DB role
    switch (user.rol) {
      case 'master_admin':
      case 'admin':
      case 'usuario':
        router.push('/admin')
        break
      case 'operaciones':
        router.push('/operaciones')
        break
      case 'chofer':
        router.push('/mobile')
        break
      case 'digitalizador':
        router.push('/digitalizador')
        break
      case 'portero':
        router.push('/porteria')
        break
      case 'cocina':
        router.push('/cocina')
        break
      // Fallback for old/other roles
      case 'admin_operaciones':
        router.push('/admin')
        break
      case 'peoneta':
        router.push('/digitalizador')
        break
      default:
        alert(`Rol "${user.rol}" no reconocido`)
    }
    setIsLoginOpen(false)
    setSelectedUser(null)
  }

  const filteredUsers = usuarios.filter(u => {
    const matchesSearch = u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.rol?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterRole) {
      if (filterRole === 'admin') {
        return matchesSearch && (u.rol === 'admin' || u.rol === 'master_admin')
      }
      return matchesSearch && u.rol === filterRole
    }
    
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-[#FFF9F0] dark:bg-zinc-950 font-sans selection:bg-[#51872E] selection:text-white">
      {/* Premium Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200/50 h-20 shadow-sm">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <img 
            src="https://tresol.cl/es/wp-content/uploads/2025/05/Recurso-5Logo-oficial-de-tresol.svg" 
            alt="Tresol Logo" 
            className="h-10 w-auto"
          />
          <div className="hidden md:flex items-center gap-8">
            <a href="#soluciones" className="text-sm font-bold text-zinc-600 hover:text-[#51872E] transition-colors uppercase tracking-widest">Soluciones</a>
            <a href="#modulos" className="text-sm font-bold text-zinc-600 hover:text-[#51872E] transition-colors uppercase tracking-widest">Módulos</a>
            <Button 
                className="bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-xl font-black px-8 h-12 shadow-lg shadow-[#116CA2]/20 transition-all hover:scale-105 active:scale-95"
                onClick={() => {
                  setFilterRole(null)
                  setIsLoginOpen(true)
                }}
            >
              INICIAR SESIÓN
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-32">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-[#51872E]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#116CA2]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center font-heading">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#51872E]/10 border border-[#51872E]/20 text-[#51872E] text-xs font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-left-4 duration-700">
                   <ShieldCheck className="size-4" />
                   ERP de Operaciones Logísticas
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-[#323232] leading-[1.1] tracking-tight animate-in fade-in slide-in-from-left-6 duration-700 delay-100 italic">
                  Tu residuo, <br />
                  <span className="text-[#51872E] not-italic">Nuestra gestión.</span>
                </h1>
                <p className="text-xl text-zinc-600 font-medium max-w-xl leading-relaxed animate-in fade-in slide-in-from-left-8 duration-700 delay-200 font-sans">
                  Gestión y valorización de residuos sólidos, líquidos y reciclables en el sur de Chile con tecnología de trazabilidad en tiempo real.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-in fade-in slide-in-from-left-10 duration-700 delay-300">
                     <Button 
                      className="h-16 px-10 bg-[#51872E] hover:bg-[#406B24] text-white rounded-2xl text-lg font-black shadow-xl shadow-[#51872E]/30 transition-all active:scale-[0.98]"
                      onClick={() => setIsLoginOpen(true)}
                     >
                       Acceder al Sistema
                       <ChevronRight className="ml-2 size-5" />
                     </Button>
                </div>
              </div>

              <div className="relative group animate-in zoom-in fade-in duration-1000 delay-200">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#51872E]/20 to-[#116CA2]/20 rounded-[3rem] blur-2xl group-hover:blur-3xl transition-all duration-700" />
                <Card className="relative overflow-hidden border-none shadow-2xl rounded-[3rem] bg-white/40 backdrop-blur-xl ring-1 ring-black/5">
                  <CardContent className="p-12 space-y-8">
                     <div className="p-4 bg-[#51872E] rounded-3xl w-fit shadow-lg shadow-[#51872E]/20">
                        <Truck className="size-10 text-white" />
                     </div>
                     <div className="space-y-4 font-heading">
                        <h3 className="text-3xl font-black text-[#323232]">Optimización de Flota</h3>
                        <p className="text-zinc-600 font-medium font-sans">
                           Gestión inteligente de rutas, cálculo automático de bonos de producción y monitoreo de estado mecánico en tiempo real desde cualquier dispositivo.
                        </p>
                     </div>
                     <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="p-6 rounded-[2rem] bg-white shadow-md border border-zinc-100 flex flex-col items-center text-center gap-3">
                           <div className="text-3xl font-black text-[#51872E]">100%</div>
                           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Trazabilidad</p>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-white shadow-md border border-zinc-100 flex flex-col items-center text-center gap-3">
                           <div className="text-3xl font-black text-[#116CA2]">Real-time</div>
                           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Monitoreo</p>
                        </div>
                     </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* Solutions Section */}
        <section id="soluciones" className="py-24 bg-zinc-50/50 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#51872E]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div className="space-y-4">
                <Badge className="bg-[#116CA2]/10 text-[#116CA2] border-[#116CA2]/20 font-black px-4 py-1.5 rounded-lg uppercase tracking-widest text-[10px]">Propuesta de Valor</Badge>
                <h2 className="text-4xl md:text-5xl font-black text-[#323232] tracking-tight">Soluciones que impulsan <br /><span className="text-[#116CA2]">la eficiencia ambiental.</span></h2>
              </div>
              <p className="text-zinc-500 font-medium max-w-sm leading-relaxed">
                Diseñamos tecnología específica para los desafíos del sector logístico y ambiental en Chile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Cumplimiento Normativo",
                  desc: "Digitalización de certificados, sellos y reportes automáticos para cumplir con la ley ambiental vigente sin papeleo manual.",
                  icon: ShieldCheck,
                  color: "#51872E"
                },
                {
                  title: "Optimización de Costos",
                  desc: "Reduce el consumo de combustible y desgaste de flota mediante inteligencia aplicada en la planificación de rutas diarias.",
                  icon: TrendingDown,
                  color: "#116CA2"
                },
                {
                  title: "Trazabilidad Inteligente",
                  desc: "Visibilidad total del residuo desde su origen hasta la disposición final, con evidencias fotográficas y geolocalización.",
                  icon: Target,
                  color: "#FBC15F"
                }
              ].map((sol, i) => (
                <div key={i} className="group p-10 rounded-[2.5rem] bg-white border border-zinc-200/50 hover:border-[#116CA2]/30 hover:shadow-2xl transition-all duration-500">
                  <div className="p-4 rounded-2xl w-fit mb-8 group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: `${sol.color}10` }}>
                    <sol.icon className="size-8" style={{ color: sol.color }} />
                  </div>
                  <h3 className="text-2xl font-black text-[#323232] mb-4">{sol.title}</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed text-sm">
                    {sol.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section id="modulos" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center space-y-4 mb-20 font-heading">
               <h2 className="text-4xl md:text-5xl font-black text-[#323232]">Plataforma Interconectada</h2>
               <p className="text-lg text-zinc-500 font-medium font-sans">Módulos especializados para cada rol operativo de la cadena Tresol.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { 
                   title: "Gestión Cocina", 
                   desc: "Control de minutas, producción diaria e inventario de casino para el personal.", 
                   icon: ChefHat,
                   color: "#FBC15F",
                   role: "cocina"
                 },
                 { 
                   title: "Operaciones", 
                   desc: "Planificación de servicios en calendario, asignación de choferes y control de flota.", 
                   icon: LayoutDashboard,
                   color: "#116CA2",
                   role: "operaciones"
                 },
                 { 
                   title: "App Conductor", 
                   desc: "Terminal móvil para reportar inicio de ruta, carga y generación de comprobantes digitales.", 
                   icon: Smartphone,
                   color: "#51872E",
                   role: "chofer"
                 },
                 { 
                   title: "Digitalizador", 
                   desc: "Estación de visualización y exportación de certificados oficiales y reportes operativos.", 
                   icon: ClipboardCheck,
                   color: "#FBC15F",
                   role: "digitalizador"
                 },
                 { 
                   title: "Control Portería", 
                   desc: "Registro de ingresos y salidas para porterías Husamontt y Tresol Antiguo.", 
                   icon: Shield,
                   color: "#116CA2",
                   role: "portero"
                 },
                 { 
                   title: "Gestión Activos", 
                   desc: "Control, ubicación y estado de contenedores y otros activos de la empresa.", 
                   icon: Package,
                   color: "#51872E",
                   role: "admin"
                 }
               ].map((mod, i) => (
                 <Card key={i} className="group hover:shadow-2xl transition-all duration-500 border-none ring-1 ring-black/5 rounded-[2.5rem] overflow-hidden bg-zinc-50/50 hover:bg-white cursor-pointer" onClick={() => {
                    setFilterRole(mod.role)
                    setIsLoginOpen(true)
                  }}>
                   <CardContent className="p-10 space-y-6">
                      <div className="p-5 rounded-2xl w-fit transition-transform group-hover:scale-110 duration-500 shadow-sm" style={{ backgroundColor: `${mod.color}10` }}>
                         <mod.icon className="size-8" style={{ color: mod.color }} />
                      </div>
                      <div className="space-y-3 font-heading">
                         <h3 className="text-2xl font-black text-[#323232]">{mod.title}</h3>
                         <p className="text-zinc-500 font-medium font-sans leading-relaxed text-sm">
                            {mod.desc}
                         </p>
                      </div>
                      <div className="pt-4 flex justify-end">
                         <div className="size-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:bg-[#51872E] group-hover:text-white transition-all">
                            <ChevronRight className="size-5" />
                         </div>
                      </div>
                   </CardContent>
                 </Card>
               ))}
            </div>
          </div>
        </section>
      </main>

      {/* Login Modal */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-lg rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl">
           <div className="bg-[#116CA2] p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
              <div className="bg-white/20 p-4 rounded-2xl w-fit mb-6">
                 <Shield className="size-10" />
              </div>
               <DialogTitle className="text-3xl font-black uppercase tracking-tight mb-2">Acceso a Tresol</DialogTitle>
               <DialogDescription className="text-white/70 font-bold">
                 {filterRole 
                   ? `Mostrando personal de ${
                       filterRole === 'chofer' ? 'App Conductor' : 
                       filterRole === 'admin' ? 'Administración' :
                       filterRole.charAt(0).toUpperCase() + filterRole.slice(1)
                     }` 
                   : "Selecciona tu perfil de usuario para ingresar."}
               </DialogDescription>
            </div>
            
            <div className="p-10 space-y-8">
               {filterRole && (
                 <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                       <Badge className="bg-[#51872E] hover:bg-[#51872E] text-white font-black px-3 py-1 rounded-lg">
                          FILTRO ACTIVO
                       </Badge>
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                         {filterRole === 'chofer' ? 'CONDUCCIÓN' : filterRole === 'admin' ? 'ADMINISTRACIÓN' : filterRole}
                       </span>
                    </div>
                    <button 
                      onClick={() => setFilterRole(null)}
                      className="text-[10px] font-black text-[#116CA2] hover:underline uppercase tracking-widest"
                    >
                      Ver todos
                    </button>
                 </div>
               )}

               <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                 <Input 
                   placeholder="Buscar usuario o cargo..." 
                   className="pl-12 h-14 bg-slate-100 border-none rounded-2xl font-bold focus-visible:ring-2 focus-visible:ring-[#116CA2]"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>

               {!selectedUser ? (
                 <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    {isLoading ? (
                       <div className="py-10 text-center font-bold text-slate-400 animate-pulse">Cargando directorio de usuarios...</div>
                    ) : filteredUsers.length === 0 ? (
                       <div className="py-10 text-center font-bold text-slate-400 italic">No se encontraron usuarios</div>
                    ) : filteredUsers.map((user) => (
                       <button 
                         key={user.id}
                         onClick={() => handleLogin(user)}
                         className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-50 hover:bg-[#116CA2]/5 border-2 border-transparent hover:border-[#116CA2]/20 transition-all group active:scale-[0.98]"
                       >
                          <div className="flex items-center gap-4 text-left">
                             <div className="size-12 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-[#116CA2] group-hover:bg-[#116CA2] group-hover:text-white transition-all">
                                {user.nombre?.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <p className="font-black text-[#323232] uppercase tracking-tight">{user.nombre}</p>
                                <Badge variant="outline" className="mt-1 border-none bg-slate-200/50 text-slate-500 font-black text-[9px] uppercase tracking-widest">
                                   {user.displayCargo}
                                </Badge>
                             </div>
                          </div>
                          <ArrowRight className="size-5 text-slate-300 group-hover:text-[#116CA2] transition-colors" />
                       </button>
                    ))}
                 </div>
               ) : (
                 <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="size-12 rounded-xl bg-[#116CA2] text-white flex items-center justify-center font-black">
                        {selectedUser.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-[#323232] uppercase truncate">{selectedUser.nombre}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedUser.displayCargo}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contraseña de acceso</label>
                      <Input 
                        type="password"
                        placeholder="••••"
                        autoFocus
                        className={`h-14 bg-slate-100 border-none rounded-2xl font-black text-center text-2xl tracking-[0.5em] focus-visible:ring-2 ${passwordError ? 'ring-2 ring-red-500' : 'focus-visible:ring-[#116CA2]'}`}
                        value={passwordInput}
                        onChange={(e) => {
                          setPasswordInput(e.target.value)
                          setPasswordError(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleLogin(selectedUser)
                        }}
                      />
                      {passwordError && (
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center mt-2 animate-bounce">Contraseña incorrecta</p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        variant="ghost" 
                        className="flex-1 h-12 rounded-xl font-black text-slate-400 uppercase tracking-widest"
                        onClick={() => setSelectedUser(null)}
                      >
                        Volver
                      </Button>
                      <Button 
                        className="flex-[2] h-12 bg-[#116CA2] hover:bg-[#0d5985] text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[#116CA2]/20"
                        onClick={() => handleLogin(selectedUser)}
                      >
                        Ingresar
                      </Button>
                    </div>
                 </div>
               )}

               <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2">
                  <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Tresol Chile • Plataforma de Gestión Ambiental</p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">Solution by Fabian Aravena - Asesoría a Gerencia</p>
               </div>
            </div>
        </DialogContent>
      </Dialog>

      <footer className="py-20 border-t border-zinc-200 bg-[#FFF9F0]">
         <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-10">
            <img 
              src="https://tresol.cl/es/wp-content/uploads/2025/05/Recurso-5Logo-oficial-de-tresol.svg" 
              alt="Tresol Logo Footer" 
              className="h-12 w-auto"
            />
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">
               <span>Puntarenas</span>
               <span>Osorno</span>
               <span>Valdivia</span>
               <span>Puerto Montt</span>
            </div>
            <p className="text-xs text-zinc-400 font-bold">© {new Date().getFullYear()} Tresol Chile - Soluciones de Gestión Ambiental</p>
            <div className="h-px w-10 bg-zinc-200" />
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">
              Desarrollado por <span className="text-[#51872E] hover:text-[#116CA2] transition-colors cursor-pointer">Fabian Aravena</span> | Ing. Civil Industrial
            </p>
         </div>
      </footer>
    </div>
  )
}