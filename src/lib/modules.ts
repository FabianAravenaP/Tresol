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
    name: "Gestión Conductores", 
    description: "Control de licencias, roles y asignación de personal de conducción.",
    href: "/admin/conductores", 
    icon: "Truck", 
    category: "Administración", 
    color: "bg-slate-500",
    type: "icon" 
  },
  { 
    id: "porteria", 
    name: "Control Portería", 
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
    name: "Maestro Flota", 
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
    name: "Gestión Activos", 
    description: "Control, ubicación y estado de contenedores y otros activos.",
    href: "/activos", 
    icon: "Package",
    category: "Administración", 
    color: "bg-indigo-500",
    type: "status"
  },
  { 
    id: "cocina", 
    name: "Gestión Cocina", 
    description: "Control de minutas, producción diaria e inventario de casino para el personal.",
    href: "/cocina", 
    icon: "Utensils", 
    category: "Servicios", 
    color: "bg-orange-500",
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
