export interface ModuleDef {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: string;
  category: "Operaciones" | "Administración" | "Logística" | "Servicios";
  color: string;
  type: "status" | "icon" | "portal";
}

/** Per-user module assignment entry stored in config_sidebar */
export type SidebarEntry = { id: string; view: "user" | "admin" }

/** Modules that expose distinct URLs for user vs admin role */
export const MODULE_DUAL_VIEWS: Record<string, { user: string; admin: string }> = {
  cocina:   { user: '/mobile/cocina',          admin: '/cocina' },
  prestamos: { user: '/prestamos',             admin: '/admin/vehiculos_menores' },
}

/** Whether a module has a user/admin view toggle */
export function hasDualView(id: string): boolean {
  return id in MODULE_DUAL_VIEWS
}

/** Resolve the effective route for a module given its assigned view */
export function getModuleHref(id: string, view: "user" | "admin" = "user"): string {
  const dual = MODULE_DUAL_VIEWS[id]
  if (dual) return view === 'admin' ? dual.admin : dual.user
  const mod = ALL_MODULES.find(m => m.id === id)
  return mod?.href ?? '/dashboard'
}

/** Returns the display name for a module with its view context, e.g. "Cocina/Admin" */
export function getModuleDisplayName(id: string, view: "user" | "admin"): string {
  const mod = ALL_MODULES.find(m => m.id === id)
  if (!mod) return id
  const viewLabel = view === 'admin' ? 'Admin' : 'Usuario'
  return `${mod.name}/${viewLabel}`
}

/** Normalise whatever is stored in config_sidebar to SidebarEntry[] */
export function parseSidebarConfig(raw: unknown): SidebarEntry[] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const first = raw[0]
  // New format: { id, view }[]
  if (typeof first === 'object' && first !== null && 'view' in first) return raw as SidebarEntry[]
  // Old format: string[] or ModuleDef objects
  return (raw as any[]).map((item) => ({
    id: typeof item === 'string' ? item : (item as any).id,
    view: 'user' as const,
  })).filter(e => e.id)
}

export const ALL_MODULES: ModuleDef[] = [
  { 
    id: "operativo", 
    name: "Panel Operativo", 
    description: "Planificación de servicios en calendario, asignación de choferes y control de flota.",
    href: "/operaciones", 
    icon: "LayoutDashboard",
    category: "Operaciones", 
    color: "bg-emerald-500",
    type: "status"
  },
  { 
    id: "conductores", 
    name: "Conductores",
    description: "Control de licencias, roles y asignación de personal de conducción.",
    href: "/admin/conductores", 
    icon: "Truck", 
    category: "Administración", 
    color: "bg-slate-500",
    type: "icon" 
  },
  { 
    id: "porteria", 
    name: "Portería",
    description: "Registro de ingresos y salidas para las porterías de la empresa.",
    href: "/porteria", 
    icon: "ShieldCheck",
    category: "Operaciones", 
    color: "bg-blue-500",
    type: "status"
  },
  { 
    id: "digitalizador", 
    name: "Digitalizador", 
    description: "Estación de visualización y exportación de certificados y reportes.",
    href: "/digitalizador", 
    icon: "FileText",
    category: "Administración", 
    color: "bg-amber-500",
    type: "status"
  },
  { 
    id: "analiticas", 
    name: "Analíticas", 
    description: "Métricas avanzadas, KPIs operacionales y reportes de gestión.",
    href: "/admin/analiticas", 
    icon: "Activity", 
    category: "Administración", 
    color: "bg-indigo-500",
    type: "icon" 
  },
  { 
    id: "usuarios", 
    name: "Usuarios", 
    description: "Control de acceso, roles y permisos de la plataforma administrativa.",
    href: "/admin/usuarios", 
    icon: "Users", 
    category: "Administración", 
    color: "bg-[#116CA2]",
    type: "icon" 
  },
  { 
    id: "flota", 
    name: "Flota",
    description: "Inventario técnico de camiones y vehículos menores de la empresa.",
    href: "/admin/flota", 
    icon: "Truck", 
    category: "Administración", 
    color: "bg-slate-600",
    type: "icon" 
  },
  { 
    id: "personal", 
    name: "Personal", 
    description: "Gestión de trabajadores, contratos y dotación general.",
    href: "/admin/personal", 
    icon: "Users", 
    category: "Administración", 
    color: "bg-zinc-600",
    type: "icon" 
  },
  { 
    id: "clientes", 
    name: "Clientes", 
    description: "Registro maestro de clientes y puntos de servicio geolocalizados.",
    href: "/admin/clientes", 
    icon: "MapPin", 
    category: "Administración", 
    color: "bg-orange-600",
    type: "icon" 
  },
  { 
    id: "activos", 
    name: "Activos",
    description: "Control, ubicación y estado de contenedores y otros activos.",
    href: "/activos", 
    icon: "Package",
    category: "Administración", 
    color: "bg-indigo-500",
    type: "status"
  },
  { 
    id: "cocina", 
    name: "Cocina",
    description: "Control de minutas, producción diaria e inventario de casino para el personal.",
    href: "/cocina", 
    icon: "Utensils", 
    category: "Servicios", 
    color: "bg-orange-500",
    type: "icon" 
  },
  { 
    id: "prestamos", 
    name: "Préstamo Vehículo",
    description: "Plataforma de solicitud y control de vehículos menores prestados por la empresa.",
    href: "/prestamos", 
    icon: "Car", 
    category: "Servicios", 
    color: "bg-teal-500",
    type: "icon" 
  },
  { 
    id: "mobile", 
    name: "App Conductor", 
    description: "Terminal móvil para reportar inicio de ruta, carga y generación de comprobantes.",
    href: "/mobile", 
    icon: "Smartphone", 
    category: "Servicios", 
    color: "bg-[#51872E]",
    type: "portal" 
  }
];
